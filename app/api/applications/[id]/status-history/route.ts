import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await postgresDB.query(
      'SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching status history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
