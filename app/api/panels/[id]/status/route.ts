import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function PUT(
  request: Request,
  { params }: { params: Promise <{ id: string }> }
) {
  try {
    const {id:panelId} =await params;
    const body = await request.json();

    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, message: "'active' field must be a boolean" },
        { status: 400 }
      );
    }

    // Set status based on the 'active' field value
    const status = active ? 'active' : 'inactive';

    const result = await postgresDB.query(
      `UPDATE panels SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`,
      [status, panelId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Panel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Panel status updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating panel status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}