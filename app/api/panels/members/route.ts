import { NextResponse } from "next/server";
import postgresDB from "@/lib/storage/cosmos-client";

export async function GET() {
  console.log("➡️ API called: /api/panels/members");

  try {
    const query = `
      SELECT 
        m.id as member_id,
        m.name,
        m.email,
        m.department,
        m.role,
        m.expertise,
        m.invitation_token,
        m.invitation_status,
        m.invitation_expiry,
        m.created_at,
        p.id as panel_id,
        p.panel_name,
        p.department as panel_department,
        p.positions,
        p.interviews_completed,
        p.status as panel_status,
        p.created_at as panel_created_at,
        p.updated_at as panel_updated_at
      FROM members m
      LEFT JOIN member_panels mp ON m.id = mp.member_id
      LEFT JOIN panels p ON mp.panel_id = p.id
    `;
    const result = await postgresDB.query(query);

    const rows = result?.rows ?? [];

    // Group panels under each member
    const grouped = rows.reduce((acc, row) => {
      const {
        member_id, name, email, department, role, expertise,
        invitation_token, invitation_status, invitation_expiry, created_at,
        panel_id, panel_name, panel_department, positions, interviews_completed, panel_status, panel_created_at, panel_updated_at
      } = row;

      if (!acc[member_id]) {
        acc[member_id] = {
          id: member_id,
          name,
          email,
          department,
          role,
          expertise,
          invitation_token,
          invitation_status,
          invitation_expiry,
          created_at,
          panels: [],
        };
      }

      if (panel_id) {
        acc[member_id].panels.push({
          id: panel_id,
          panel_name,
          department: panel_department,
          positions,
          interviews_completed,
          status: panel_status,
          created_at: panel_created_at,
          updated_at: panel_updated_at,
        });
      }

      return acc;
    }, {} as Record<string, {
      id: string;
      name: string;
      email: string;
      department: string;
      role: string;
      expertise: string;
      invitation_token: string | null;
      invitation_status: string | null;
      invitation_expiry: string | null;
      created_at: string;
      panels: {
        id: string;
        panel_name: string;
        department: string;
        positions: number;
        interviews_completed: number;
        status: string;
        created_at: string;
        updated_at: string;
      }[];
    }>);

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("❌ Error fetching members with panels:", error);
    return NextResponse.json(
      { error: "Failed to fetch members with panels" },
      { status: 500 }
    );
  }
}
