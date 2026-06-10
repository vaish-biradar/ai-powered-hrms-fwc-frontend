import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';
import { sendMail } from '@/lib/mail/mail-transporter';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
   
    const session = await getServerSession(authOptions);
    const {id:applicationId} =await params;
    const { panelId, roundId, scheduledDate, meetingLink, meetingLocation } = await req.json();

    // Validate required fields
    if (!panelId || !roundId || !scheduledDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get current user info
    if (!session || !session.user || !session.user.email) {
      return new NextResponse('Unauthorized: Session or user information is missing', { status: 401 });
    }

    const currentUserRes = await postgresDB.query(
      `SELECT id, name, email FROM members WHERE email = $1`,
      [session.user.email]
    );

    if (!currentUserRes.rows.length) {
      return new NextResponse('User not found', { status: 404 });
    }

    const currentUser = currentUserRes.rows[0];

    // Check if all panel members confirmed availability
    const availabilityRes = await postgresDB.query(
      `SELECT ar.*, m.name, m.email
       FROM availability_requests ar
       JOIN members m ON m.id = ar.member_id
       JOIN member_panels pm ON pm.member_id = m.id
       WHERE pm.panel_id = $1 AND ar.application_id = $2 AND ar.round_id = $3
       ORDER BY ar.created_at DESC`,
      [panelId, applicationId, roundId]
    );

    const pendingMembers = availabilityRes.rows.filter(r => !r.response || r.response !== 'available');
    
    if (pendingMembers.length > 0) {
      // Some members have not confirmed availability
      // You can decide whether to force schedule or not
      console.warn(`Scheduling interview despite ${pendingMembers.length} members not confirming availability`);
    }

    // Begin transaction
    await postgresDB.query('BEGIN');

    // Schedule the interview
    const interviewRes = await postgresDB.query(
      `INSERT INTO interviews
       (id, application_id, round_id, panel_id, scheduled_by_id, scheduled_date, meeting_link, meeting_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        crypto.randomUUID(),
        applicationId,
        roundId,
        panelId,
        currentUser.id,
        scheduledDate,
        meetingLink || null,
        meetingLocation || null
      ]
    );

    const interview = interviewRes.rows[0];

    // Update application status and current round
    await postgresDB.query(
      `UPDATE applications
       SET status = 'interview_scheduled', current_round_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [roundId, applicationId]
    );

    // Get application and round details for notifications
    const detailsRes = await postgresDB.query(
      `SELECT a.*, r.round_name
       FROM applications a
       JOIN interview_rounds r ON r.id = $1
       WHERE a.id = $2`,
      [roundId, applicationId]
    );

    const applicationDetails = detailsRes.rows[0];

    // Get panel members
    const membersRes = await postgresDB.query(
      `SELECT m.* FROM members m
       JOIN member_panels pm ON m.id = pm.member_id
       WHERE pm.panel_id = $1`,
      [panelId]
    );

    // Prepare emails for all panel members and candidate
    const formattedDate = new Date(scheduledDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    // Send emails to panel members
    for (const member of membersRes.rows) {
      await sendMail(
        session.accessToken as string,
        member.email,
       `Interview Scheduled: ${applicationDetails.round_name} for ${applicationDetails.candidate_name}`,
       `
          <p>Dear ${member.name},</p>
          
          <p>An interview has been scheduled for the ${applicationDetails.round_name} with candidate ${applicationDetails.candidate_name} for the ${applicationDetails.job_title} position.</p>
          
          <p><strong>Date and Time:</strong> ${formattedDate}</p>
          
          ${meetingLocation ? `<p><strong>Location:</strong> ${meetingLocation}</p>` : ''}
          ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
          
          <p>Please prepare for the interview and be ready on time.</p>
          
          <p>You can access the candidate's details and provide feedback after the interview by visiting your dashboard.</p>
          
          <p>Regards,<br>${currentUser.name}</p>
        `,
        [], // attachments
        "", // cc
        "HTML"

      );
    }

    // Send email to candidate
    await sendMail(
        session.accessToken as string,
     applicationDetails.candidate_email,
    `Interview Scheduled: ${applicationDetails.round_name} for ${applicationDetails.job_title} position`,
     `
        <p>Dear ${applicationDetails.candidate_name},</p>
        
        <p>We are pleased to inform you that your application for the ${applicationDetails.job_title} position has progressed to the next stage.</p>
        
        <p>An interview has been scheduled for:</p>
        
        <p><strong>Interview Type:</strong> ${applicationDetails.round_name}</p>
        <p><strong>Date and Time:</strong> ${formattedDate}</p>
        
        ${meetingLocation ? `<p><strong>Location:</strong> ${meetingLocation}</p>` : ''}
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
        
        <p>Please be prepared and join the interview on time. If you need to reschedule for any reason, please reply to this email as soon as possible.</p>
        
        <p>We look forward to speaking with you!</p>
        
        <p>Best regards,<br>${currentUser.name}</p>
      `,
        [], // attachments
        "", // cc
        "HTML"
    );

    await postgresDB.query('COMMIT');

    return NextResponse.json(interview);
  } catch (error) {
    await postgresDB.query('ROLLBACK');
    console.error('Error scheduling interview:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}