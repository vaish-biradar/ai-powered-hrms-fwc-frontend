import {  NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET() {
  // Extract the application ID from the request parameters


  try {
    const result = await postgresDB.query('SELECT * FROM applications WHERE status = $1', ['screening_completed']);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
console.log('result.rows', result.rows);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
