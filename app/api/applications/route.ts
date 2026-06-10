import { NextRequest, NextResponse } from "next/server";
import {  updateItem,getAllApplicationsWithJoin} from "@/lib/storage/cosmos-utils";
import { ItemDefinition } from "@azure/cosmos";


// This function handles GET requests to fetch all applications from the database
export async function GET() {
  try {
    const applications = await getAllApplicationsWithJoin();
    
    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

// This function handles PUT requests to update an application in the database
export async function PUT(req: NextRequest) {
    try {
        // Extract all possible fields from the request
        const { id, status, candidate_email, candidate_phone } = await req.json();
        
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        
        // Create an update object with only the fields that were provided
        const updateData: Partial<ItemDefinition> = {};
        
        // Add each provided field to the update data
        if (status !== undefined) {
            updateData.status = status;
        }
        
        if (candidate_email !== undefined) {
            updateData.candidate_email = candidate_email;
        }
        
        if (candidate_phone !== undefined) {
            updateData.candidate_phone = candidate_phone;
        }
        
        // Check if any fields were provided for update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ 
                error: "At least one field (status, candidate_email, or candidate_phone) is required" 
            }, { status: 400 });
        }
        
        // Update the application with the provided fields
        const updatedApplication = await updateItem("applications", id, updateData);
        
        // Determine success message based on what was updated
        let message = "Application updated successfully";
        if (status && !candidate_email && !candidate_phone) {
            message = "Status updated successfully";
        } else if (candidate_email && !status && !candidate_phone) {
            message = "Email updated successfully";
        } else if (candidate_phone && !status && !candidate_email) {
            message = "Phone number updated successfully";
        }
        
        return NextResponse.json({ 
            message, 
            application: updatedApplication 
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error updating application:", error);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}