import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: panelId } = await params;
      const { memberIds } = await request.json(); // expecting array
  
      if (!panelId || !Array.isArray(memberIds) || memberIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'panelId and memberIds[] are required' },
          { status: 400 }
        );
      }
  
      // Filter out existing members first
      const existingQuery = `
        SELECT member_id FROM member_panels WHERE panel_id = $1 AND member_id = ANY($2);
      `;
      const existingResult = await postgresDB.query(existingQuery, [panelId, memberIds]);
      const existingIds = existingResult.rows.map((row) => row.member_id);
  
      const newMemberIds = memberIds.filter((id) => !existingIds.includes(id));
  
      if (newMemberIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'All selected members are already in the panel' },
          { status: 409 }
        );
      }
  
      const insertQuery = `
        INSERT INTO member_panels (member_id, panel_id)
        SELECT unnest($1::uuid[]), $2
        RETURNING *;
      `;
  
      const result = await postgresDB.query(insertQuery, [newMemberIds, panelId]);
  
      return NextResponse.json({
        success: true,
        message: 'Members added to panel',
        data: result.rows,
      });
    } catch (error) {
      console.error('Failed to add members to panel:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to add members to panel' },
        { status: 500 }
      );
    }
  }
  