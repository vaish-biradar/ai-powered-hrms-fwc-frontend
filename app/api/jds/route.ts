import { NextResponse,NextRequest } from "next/server";
import { deleteItem,  getItemById, getJobDescriptionsWithApplications, updateItem} from "@/lib/storage/cosmos-utils";
import { deleteBlob } from "@/lib/storage/blobstorage-utils";

const CONTAINER_NAME = "job_descriptions";

/**
 * GET method to fetch all applications from Cosmos DB
 */
export async function GET() {
  try {
    const jds = await getJobDescriptionsWithApplications();

    // Sort items from recent to oldest based on "created_date"
    jds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(jds, { status: 200 });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
    try {
        const { id, ...updateData } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updatedItem = await updateItem(CONTAINER_NAME, id, updateData);
        
        return NextResponse.json(updatedItem, { status: 200 });
    } catch (error) {
        console.error("Error updating job description:", error);
        return NextResponse.json({ error: "Failed to update job description" }, { status: 500 });
    }
}



export async function DELETE(req: NextRequest) {
  
  try {
    const { id, jdurl } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "JD ID is required" }, { status: 400 });
    }
    
    // 1️⃣ Fetch Resume Details
    const jdData = await getItemById(CONTAINER_NAME, id);
    
    if (!jdData) {
      return NextResponse.json({ error: "JD not found" }, { status: 404 });
    }
    
    const blobName = jdurl.split("/").pop();
    const decodedBlobName = decodeURIComponent(blobName || "");
    
    // 2️⃣ Delete Resume from Cosmos DB
    await deleteItem(CONTAINER_NAME, id);
    
    // 3️⃣ Delete Blob from Azure Storage
    const result = await deleteBlob('jobdescriptions', decodedBlobName); // Replace with your Azure container name
    
    if (result?.error) {
      console.error('Error deleting blob:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ message: `JD '${id}' and blob deleted successfully!` }, { status: 200 });
  } catch (error) {
    console.error("Error deleting JD:", error);

    return NextResponse.json({ error: "Failed to delete JD" }, { status: 500 });
  }
}