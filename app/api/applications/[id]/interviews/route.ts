import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
   

    const {id:applicationId} =await params;
    const interviews = await postgresDB.query(
      `SELECT i.*, 
              r.round_name, 
              p.panel_name,
              m.name as scheduled_by_name
       FROM interviews i
       JOIN interview_rounds r ON r.id = i.round_id
       LEFT JOIN panels p ON p.id = i.panel_id
       LEFT JOIN members m ON m.id = i.scheduled_by_id
       WHERE i.application_id = $1
       ORDER BY i.scheduled_date DESC`,
      [applicationId]
    );

    return NextResponse.json(interviews.rows);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}