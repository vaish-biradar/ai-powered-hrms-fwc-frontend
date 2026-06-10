import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET() {
  try {
   

    const rounds = await postgresDB.query(
      `SELECT * FROM interview_rounds 
       WHERE is_active = true 
       ORDER BY round_order ASC`
    );

    return NextResponse.json(rounds.rows);
  } catch (error) {
    console.error('Error fetching interview rounds:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}