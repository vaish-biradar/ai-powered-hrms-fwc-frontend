import { NextRequest, NextResponse } from "next/server";
import { generateSasToken } from "@/lib/storage/blobstorage-utils";

export async function POST(req: NextRequest) {
    try {
        const { blobName, container } = await req.json();

        if (!blobName || !container) {
            return NextResponse.json({ error: "Blob name and container are required" }, { status: 400 });
        }

        const blobNameFinal = decodeURIComponent(blobName.split("/").pop() || "");

        if (!blobNameFinal) {
            return NextResponse.json({ error: "Invalid blob name" }, { status: 400 });
        }

        const { url } = await generateSasToken(container, blobNameFinal);
        return NextResponse.json({ fileUrl: `${url}` });
    } catch (error) {
        console.error("Error generating SAS token:", error);
        return NextResponse.json({ error: "Failed to generate SAS token" }, { status: 500 });
    }
}
