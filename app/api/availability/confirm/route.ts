import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const response = url.searchParams.get('response');

    if (!token || !['available', 'unavailable'].includes(response || '')) {
      return new Response('Invalid request', { status: 400 });
    }

    // Get availability request
    const requestRes = await postgresDB.query(
      `SELECT * FROM availability_requests WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (!requestRes.rows.length) {
      return new Response('Invalid or expired token', { status: 400 });
    }

    const availabilityRequest = requestRes.rows[0];

    // Update availability status
    await postgresDB.query(
      `UPDATE availability_requests 
       SET response = $1, responded_at = NOW() 
       WHERE token = $2`,
      [response, token]
    );

    // Get application details for confirmation page
    const applicationRes = await postgresDB.query(
      `SELECT a.*, r.round_name 
       FROM applications a
       JOIN interview_rounds r ON r.id = $1
       WHERE a.id = $2`,
      [availabilityRequest.round_id, availabilityRequest.application_id]
    );

    if (!applicationRes.rows.length) {
      return new Response('Application not found', { status: 404 });
    }

    const application = applicationRes.rows[0];

    // Redirect to confirmation page
    return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/availability-confirmation?status=${response}&candidate=${encodeURIComponent(application.candidate_name)}&round=${encodeURIComponent(application.round_name)}`
      );
        } catch (error) {
    console.error('Error confirming availability:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}