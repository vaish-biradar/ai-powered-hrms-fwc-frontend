import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string } >}) {
  // Extract the application ID from the request parameters

  const { id } = await params;

  try {
    const result = await postgresDB.query('SELECT * FROM applications WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
