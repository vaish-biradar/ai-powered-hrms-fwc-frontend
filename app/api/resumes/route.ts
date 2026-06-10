import { NextRequest, NextResponse } from "next/server";
import { deleteItem, getAllItems, getItemById} from "@/lib/storage/cosmos-utils";
import { deleteBlob } from "@/lib/storage/blobstorage-utils";

const CONTAINER_NAME = "resumes";

/**
 * GET method to fetch all applications from Cosmos DB
 */
export async function GET() {
  try {
    const resumes = await getAllItems(CONTAINER_NAME);
    
    return NextResponse.json(resumes, { status: 200 });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}



export async function DELETE(req: NextRequest) {
    try {
      const { id } = await req.json();
  
      if (!id) {
        return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
      }
  
      // 1️⃣ Fetch Resume Details
      const resumeData = await getItemById(CONTAINER_NAME, id);
      if (!resumeData) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }
  
      const resumeUrl = resumeData.path;
      const blobName = resumeUrl.split("/").pop();
      const decodedBlobName = decodeURIComponent(blobName || "");
  
      // 2️⃣ Delete Resume from Cosmos DB
      await deleteItem(CONTAINER_NAME, id);
      
  
      // 3️⃣ Delete Blob from Azure Storage
      const result = await deleteBlob(CONTAINER_NAME, decodedBlobName); // Replace with your Azure container name
      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
  
      return NextResponse.json({ message: `Resume '${id}' and blob deleted successfully!` }, { status: 200 });
    } catch (error) {
      console.error("Error deleting resume:", error);
      return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
    }
  }