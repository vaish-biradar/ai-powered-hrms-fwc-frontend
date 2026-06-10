import { NextRequest, NextResponse } from "next/server";
import { getMemberByToken, updateItem } from "@/lib/storage/cosmos-utils";
import postgresDB from '@/lib/storage/cosmos-client';

export const POST = async (req: NextRequest) => {
  try {
    const { token, action, panel } = await req.json();

    if (!token || !["accept", "reject"].includes(action) || !panel) {
      return NextResponse.json(
        { success: false, message: "Invalid token or action or panel" },
        { status: 400 }
      );
    }

    const member = await getMemberByToken(token);

    if (!member || !member.id) {
      return NextResponse.json(
        { success: false, message: "Invitation not found" },
        { status: 404 }
      );
    }

    if (
      member.invitation_expiry &&
      new Date(member.invitation_expiry) < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (["accepted", "rejected"].includes(member.invitation_status)) {
      return NextResponse.json(
        {
          success: false,
          message: `You have already ${member.invitation_status} this invitation.`,
        },
        { status: 400 }
      );
    }

    // Update invitation status
    await updateItem("members", member.id, {
      invitation_status: action === "accept" ? "accepted" : "rejected",
    });

    // If accepted, insert into member_panels
    if (action === "accept") {
      await postgresDB.query(`
        INSERT INTO member_panels (member_id, panel_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `, [member.id, panel]);
    }

    return NextResponse.json({
      success: true,
      message:
        action === "accept"
          ? "You have successfully accepted the invitation."
          : "You have rejected the invitation.",
    });
  } catch (error) {
    console.error("❌ Error in POST /api/invitation/respond:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
};
