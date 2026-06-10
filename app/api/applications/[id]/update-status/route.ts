import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params:Promise < { id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } =await params;
  const { status, feedback } = await req.json();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }





  try {
    await postgresDB.query('BEGIN');
    const memberResult = await postgresDB.query(
        'SELECT id, name, email FROM members WHERE email = $1',
        [session.user.email]
      );
      if (memberResult.rows.length === 0) {
        throw new Error('Member not found');
      }
      const member = memberResult.rows[0];
    await postgresDB.query(
      'UPDATE applications SET status = $1, updated_at = now() WHERE id = $2',
      [status, id]
    );


    const historyResult = await postgresDB.query(
      `INSERT INTO application_status_history (
        id, application_id, status, feedback, changed_by_id, changed_by_name, changed_by_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        crypto.randomUUID(),
        id,
        status,
        
        feedback || null,
        member.id ,
        session.user.name || 'Unknown',
        session.user.email || 'unknown@example.com',
      ]
    );
    

    await postgresDB.query('COMMIT');

    return NextResponse.json(historyResult.rows[0]);
  } catch (error) {
    await postgresDB.query('ROLLBACK');
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
