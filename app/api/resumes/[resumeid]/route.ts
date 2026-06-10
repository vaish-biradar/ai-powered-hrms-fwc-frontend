import { NextRequest, NextResponse } from "next/server";
import { getItemById } from "@/lib/storage/cosmos-utils";

const CONTAINER_NAME = "resumes";

/**
 * GET method to fetch a specific resume by ID from Cosmos DB
 */
export async function GET(req: NextRequest, context: { params: Promise<{ resumeid: string }> }) {
  const { resumeid } = await context.params; // Extract resume ID from route params

  try {
    if (!resumeid) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const resume = await getItemById(CONTAINER_NAME, resumeid);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json(resume, { status: 200 });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
  }
}
