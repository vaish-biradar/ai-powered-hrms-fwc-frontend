import { NextResponse } from "next/server";
import transporter, { contactSenderEmail } from "@/lib/mail/web-mail";

export const dynamic = "force-dynamic";

type FeedbackPayload = {
  candidateEmail?: string;
  candidateName?: string;
  jobTitle?: string;
  status?: string;
  feedback?: string;
  overallImpression?: string;
  areasForImprovement?: string;
  technicalScore?: string;
  communicationScore?: string;
  problemSolvingScore?: string;
  culturalFitScore?: string;
};

const humanizeStatus = (status: string) => {
  if (!status) return "Not specified";
  if (status === "on_hold") return "On Hold";
  if (status === "reject") return "Reject";
  return status;
};

export async function POST(req: Request) {
  try {
    const senderEmail = contactSenderEmail;

    if (!senderEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sender email is not configured. Set GMAIL_USERNAME/GMAIL_PASSWORD (or EMAIL_USER/EMAIL_PASS).",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as FeedbackPayload;

    if (!body.candidateEmail || !body.candidateName || !body.jobTitle || !body.status || !body.feedback) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const finalStatus = humanizeStatus(body.status);

    const subject = `FWC Mock Interview Feedback - ${body.jobTitle}`;
    const text = `
Hi ${body.candidateName},

Thank you for attending the mock interview for ${body.jobTitle}.

Status: ${finalStatus}
Feedback: ${body.feedback}

Overall Impression: ${body.overallImpression || "N/A"}
Areas for Improvement: ${body.areasForImprovement || "N/A"}

Skills Summary:
- Technical Skills: ${body.technicalScore || "N/A"}
- Communication Skills: ${body.communicationScore || "N/A"}
- Problem Solving: ${body.problemSolvingScore || "N/A"}
- Cultural Fit: ${body.culturalFitScore || "N/A"}

Regards,
FWC HR Team
https://www.fwc.co.in
    `.trim();

    const html = `
      <p>Hi ${body.candidateName},</p>
      <p>Thank you for attending the mock interview for <strong>${body.jobTitle}</strong>.</p>
      <p><strong>Status:</strong> ${finalStatus}</p>
      <p><strong>Feedback:</strong> ${body.feedback}</p>
      <hr />
      <p><strong>Overall Impression:</strong> ${body.overallImpression || "N/A"}</p>
      <p><strong>Areas for Improvement:</strong> ${body.areasForImprovement || "N/A"}</p>
      <p><strong>Skills Summary:</strong></p>
      <ul>
        <li>Technical Skills: ${body.technicalScore || "N/A"}</li>
        <li>Communication Skills: ${body.communicationScore || "N/A"}</li>
        <li>Problem Solving: ${body.problemSolvingScore || "N/A"}</li>
        <li>Cultural Fit: ${body.culturalFitScore || "N/A"}</li>
      </ul>
      <p>Regards,<br />FWC HR Team<br /><a href="https://www.fwc.co.in">www.fwc.co.in</a></p>
    `;

    await transporter.sendMail({
      from: `FWC HR Team <${senderEmail}>`,
      to: body.candidateEmail,
      subject,
      text,
      html,
    });

    return NextResponse.json({ success: true, message: "Feedback email sent successfully" });
  } catch (error: any) {
    console.error("[mock-interview-feedback] Email sending error:", error);

    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SMTP authentication failed. For Gmail, use GMAIL_USERNAME and a valid Google App Password in GMAIL_PASSWORD.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send feedback email" },
      { status: 500 }
    );
  }
}
