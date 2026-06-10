import { NextResponse, NextRequest } from "next/server";
import { Client } from "@microsoft/microsoft-graph-client";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

export async function GET() {

  const reqHeaders = new Headers(Object.fromEntries((await headers()).entries()));
  const mockReq = new NextRequest("http://localhost", { headers: reqHeaders });
  const token = await getToken({ req: mockReq });

  if (!token?.accessToken) {
    console.warn("🚫 No access token found.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, token.accessToken as string);
    },
  });

  try {
    const result = await client.api("/me/events").version("v1.0").get();
    const allEvents = result?.value || [];

    // Filter events where the subject includes "interview" (case-insensitive)
    interface Event {
      subject?: string;
      start?: {
        dateTime?: string;
      };
    }

    const interviewEvents = allEvents.filter((event: Event) =>
      event.subject?.toLowerCase().includes("interview")
    );

    // Log invalid start times just for debugging
    for (const event of interviewEvents) {
      if (!event.start?.dateTime) {
        console.warn("🚫 Invalid start time:", event);
      }
    }

    return NextResponse.json({ value: interviewEvents });
  } catch (err) {
    console.error("❌ Error fetching meetings:", err);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}
