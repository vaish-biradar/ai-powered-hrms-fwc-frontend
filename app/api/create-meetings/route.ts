import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { sendMailViaSMTP } from "@/lib/mail/mail-transporter-smtp";

type MeetingRequest = {
  subject: string;
  start: string;
  end: string;
  attendees: string[];
  location?: string;
  meetingLink?: string;
  body?: { contentType?: string; content?: string };
};

function buildInviteText(subject: string, startDateTime: string, endDateTime: string, location?: string, meetingLink?: string) {
  return [
    `Interview Invitation: ${subject}`,
    "",
    `Start (UTC): ${startDateTime}`,
    `End (UTC): ${endDateTime}`,
    `Location: ${location && location.trim().length > 0 ? location : "Online meeting"}`,
    meetingLink && meetingLink.trim().length > 0 ? `Meeting Link: ${meetingLink}` : null,
    "",
    "Please join on time. If this timing does not work, reply to this email.",
  ].filter(Boolean).join("\n");
}

function buildInviteHtml(subject: string, startDateTime: string, endDateTime: string, location?: string, bodyHtml?: string, meetingLink?: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin-bottom: 12px;">Interview Invitation</h2>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Start (UTC):</strong> ${startDateTime}</p>
      <p><strong>End (UTC):</strong> ${endDateTime}</p>
      <p><strong>Location:</strong> ${location && location.trim().length > 0 ? location : "Online meeting"}</p>
      ${meetingLink && meetingLink.trim().length > 0 ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" target="_blank" rel="noopener noreferrer">${meetingLink}</a></p>` : ""}
      ${bodyHtml ? `<hr style="margin: 16px 0;" /><div>${bodyHtml}</div>` : ""}
      <p style="margin-top: 16px;">Please join on time. If this timing does not work, reply to this email.</p>
    </div>
  `;
}

export async function POST(req: NextRequest) {

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ Error parsing JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON body", details: String(err) }, { status: 400 });
  }

  const {
    subject,
    start,
    end,
    attendees,
    location,
    meetingLink,
    body: meetingBody,
  }: MeetingRequest = body;

  const meetingProvider = (process.env.MEETING_PROVIDER || "graph").toLowerCase();
  const smtpFallbackEnabled = (process.env.MEETING_SMTP_FALLBACK || "true").toLowerCase() === "true";

  const token = await getToken({ req });
  if (!token) {
    console.warn("⚠️ No auth token found. Unauthorized.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = token.accessToken as string | undefined;

  let startDateTime: string;
  let endDateTime: string;

  try {
    startDateTime = new Date(start).toISOString();
    endDateTime = new Date(end).toISOString();

  } catch (err) {
    console.error("❌ Invalid date format:", err);
    return NextResponse.json({ error: "Invalid date format", details: String(err) }, { status: 400 });
  }

  const attendeeAddresses = attendees
    .filter((email) => typeof email === "string" && email.trim().length > 0)
    .map((email) => email.trim());

  if (attendeeAddresses.length === 0) {
    return NextResponse.json({ error: "At least one attendee is required" }, { status: 400 });
  }

  if (meetingProvider === "smtp") {
    const inviteText = buildInviteText(subject, startDateTime, endDateTime, location, meetingLink);
    const inviteHtml = buildInviteHtml(subject, startDateTime, endDateTime, location, meetingBody?.content, meetingLink);

    const smtpResult = await sendMailViaSMTP(attendeeAddresses, subject, inviteText, undefined, undefined, inviteHtml);
    if (!smtpResult.success) {
      return NextResponse.json({ error: "Failed to send meeting invites via SMTP" }, { status: 500 });
    }

    return NextResponse.json(
      {
        provider: "smtp",
        joinUrl: meetingLink || null,
        startDateTime,
        endDateTime,
        message: "Invites sent via SMTP (email-only mode).",
      },
      { status: 200 }
    );
  }

  const attendeeEmails = attendeeAddresses.map((email) => ({
    emailAddress: { address: email, name: email },
    type: "required",
  }));



  const payload = {
    subject,
    start: {
      dateTime: startDateTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "UTC",
    },
    attendees: attendeeEmails,
    location: location ? { displayName: location } : undefined,
    body: meetingBody?.content
      ? {
          contentType: meetingBody.contentType || "HTML",
          content: meetingBody.content,
        }
      : undefined,
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };


  try {
    if (!accessToken) {
      throw new Error("Missing Graph access token for meeting provider 'graph'.");
    }

    const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });


    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: Record<string, unknown> | null = null;
      try {
        parsedError = errorText ? JSON.parse(errorText) : null;
      } catch {
        parsedError = null;
      }

      const requestId = response.headers.get("request-id") || response.headers.get("x-ms-ags-diagnostic");
      const errorMessage = parsedError?.error
        ? JSON.stringify(parsedError.error)
        : errorText || response.statusText || "Unknown Graph API error";

      console.error("❌ Graph API Error:", {
        status: response.status,
        statusText: response.statusText,
        requestId,
        errorMessage,
      });

      if (smtpFallbackEnabled) {
        const inviteText = buildInviteText(subject, startDateTime, endDateTime, location, meetingLink);
        const inviteHtml = buildInviteHtml(subject, startDateTime, endDateTime, location, meetingBody?.content, meetingLink);
        const smtpResult = await sendMailViaSMTP(attendeeAddresses, subject, inviteText, undefined, undefined, inviteHtml);

        if (smtpResult.success) {
          return NextResponse.json(
            {
              provider: "smtp-fallback",
              joinUrl: meetingLink || null,
              startDateTime,
              endDateTime,
              message: "Graph meeting creation failed. Invites sent via SMTP fallback.",
              graphError: errorMessage,
              requestId,
            },
            { status: 200 }
          );
        }
      }

      return NextResponse.json(
        {
          error: "Failed to create meeting",
          details: errorMessage,
          status: response.status,
          requestId,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(
      {
        provider: "graph",
        joinUrl: result.onlineMeeting?.joinUrl ?? meetingLink ?? null,
        startDateTime,
        endDateTime,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Internal Server Error:", err);

    if (smtpFallbackEnabled) {
      const inviteText = buildInviteText(subject, startDateTime, endDateTime, location, meetingLink);
      const inviteHtml = buildInviteHtml(subject, startDateTime, endDateTime, location, meetingBody?.content, meetingLink);
      const smtpResult = await sendMailViaSMTP(attendeeAddresses, subject, inviteText, undefined, undefined, inviteHtml);

      if (smtpResult.success) {
        return NextResponse.json(
          {
            provider: "smtp-fallback",
            joinUrl: meetingLink || null,
            startDateTime,
            endDateTime,
            message: "Graph meeting creation failed. Invites sent via SMTP fallback.",
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ error: "Something went wrong", details: String(err) }, { status: 500 });
  }
}
