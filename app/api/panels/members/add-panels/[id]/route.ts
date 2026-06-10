import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: memberId } = await params;
      const { panelIds } = await request.json(); // expecting array
  
      if (!memberId || !Array.isArray(panelIds) || panelIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'panelId and memberIds[] are required' },
          { status: 400 }
        );
      }
  
      // Filter out existing members first
      const existingQuery = `
        SELECT panel_id FROM member_panels WHERE member_id = $1 AND panel_id = ANY($2);
      `;
      const existingResult = await postgresDB.query(existingQuery, [memberId, panelIds]);
      const existingIds = existingResult.rows.map((row) => row.panel_id);
  
      const newPanelIds = panelIds.filter((id) => !existingIds.includes(id));
  
      if (newPanelIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'All selected panels are already in the memeber' },
          { status: 409 }
        );
      }
  
      const insertQuery = `
        INSERT INTO member_panels (panel_id, member_id)
        SELECT unnest($1::uuid[]), $2
        RETURNING *;
      `;
  
      const result = await postgresDB.query(insertQuery, [newPanelIds,memberId ]);
  
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
  