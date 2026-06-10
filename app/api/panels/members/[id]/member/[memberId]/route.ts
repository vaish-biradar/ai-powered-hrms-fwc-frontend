import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function DELETE(
  request: Request,
  { params }: { params: Promise <{ id: string; memberId: string } > }
) {
  try {
    const { id:panelId, memberId } =await params;

    if (!panelId || !memberId) {
      return NextResponse.json(
        { success: false, message: 'Both panelId and memberId are required' },
        { status: 400 }
      );
    }

    const deleteQuery = `
      DELETE FROM member_panels
      WHERE panel_id = $1 AND member_id = $2
      RETURNING *;
    `;

    const result = await postgresDB.query(deleteQuery, [panelId, memberId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Member not found in panel' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed from panel',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to remove member from panel:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove member from panel' },
      { status: 500 }
    );
  }
}
