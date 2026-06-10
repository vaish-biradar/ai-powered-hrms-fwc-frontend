import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ title: string }> }) {
  const { title } = await params;

  try {
    const result = await postgresDB.query(
        `SELECT id FROM public.job_descriptions WHERE title = $1 LIMIT 1`,
        [decodeURIComponent(title)]
      );

    return NextResponse.json(result.rows[0].id);
  } catch (error) {
    console.error('Error fetching job ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
