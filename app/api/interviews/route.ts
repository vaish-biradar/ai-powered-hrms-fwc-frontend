import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET() {
  try {
    const result = await postgresDB.query(
      `SELECT
         i.id,
         i.scheduled_date,
         i.meeting_link,
         i.meeting_location,
         i.created_at,
         r.round_name,
         p.panel_name,
         m.name  AS scheduled_by_name,
         m.email AS scheduled_by_email,
         a.candidate_name,
         a.candidate_email,
         a.job_title,
         a.status AS application_status
       FROM interviews i
       JOIN interview_rounds r  ON r.id = i.round_id
       LEFT JOIN panels       p  ON p.id = i.panel_id
       LEFT JOIN members      m  ON m.id = i.scheduled_by_id
       LEFT JOIN applications a  ON a.id = i.application_id
       ORDER BY i.scheduled_date DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching all interviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
