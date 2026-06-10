// File: /app/api/applications/[id]/check-availability/status/route.js
import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, round :string }> }
) {
  try {
    const { id: applicationId, round } = await params;

    if (!applicationId) {
      return new NextResponse("Application ID is required", { status: 400 });
    }

    // Join with members table via availability_requests.member_id
    const availabilityRequests = await postgresDB.query(
      `SELECT 
        ar.token AS id,
        ar.member_id, 
        ar.response,
        ar.responded_at,
        m.name AS member_name,
        m.email AS member_email,
        m.role AS member_role,
        m.department AS member_department
      FROM 
        availability_requests ar
      JOIN 
        members m ON ar.member_id = m.id
      WHERE 
        ar.application_id = $1 AND ar.round_id = $2
      ORDER BY 
        ar.created_at DESC`,
      [applicationId, round]
    );

    if (!availabilityRequests.rows.length) {
      console.log("No availability requests found for this application.");
      return NextResponse.json([]);
    }

    const membersWithAvailability = availabilityRequests.rows.map(row => ({
      id: row.member_id,
      name: row.member_name,
      email: row.member_email,
      role: row.member_role,
      department: row.member_department,
      availability: row.response || 'pending',
      responseTime: row.responded_at ? new Date(row.responded_at).toISOString() : null,
    }));
console.log("Members with availability:", membersWithAvailability);

    return NextResponse.json(membersWithAvailability);
  } catch (error) {
    console.error("Error fetching availability status:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
