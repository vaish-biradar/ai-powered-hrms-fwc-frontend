import { NextRequest, NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client';
import { sendMail } from '@/lib/mail/mail-transporter';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    const { id: applicationId } = await params;
    const {
      panelId,
      roundId,
      scheduledDate,
      meetingLink,
      meetingLocation,
      candidateName,
      jobTitle
    } = await req.json();

    // Validate required fields
    if (!panelId || !roundId || !scheduledDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get panel members
    const membersRes = await postgresDB.query(
      `SELECT m.* FROM members m
       JOIN member_panels pm ON m.id = pm.member_id
       WHERE pm.panel_id = $1`,
      [panelId]
    );

    if (!membersRes.rows.length) {
      return new NextResponse('No panel members found', { status: 404 });
    }

    const members = membersRes.rows;

    // Get round information
    const roundRes = await postgresDB.query(
      `SELECT * FROM interview_rounds WHERE id = $1`,
      [roundId]
    );

    if (!roundRes.rows.length) {
      return new NextResponse('Interview round not found', { status: 404 });
    }

    const round = roundRes.rows[0];

    // Get current user info
    const currentUserRes = await postgresDB.query(
      `SELECT id, name, email FROM members WHERE email = $1`,
      [session?.user.email]
    );

    if (!currentUserRes.rows.length) {
      return new NextResponse('User not found', { status: 404 });
    }

    const currentUser = currentUserRes.rows[0];

    // Generate availability tokens for each panel member
    for (const member of members) {
      const token = crypto.randomUUID();
      
      // Save availability request in database
      await postgresDB.query(
        `INSERT INTO availability_requests
         (token, member_id, application_id, round_id, requested_date, requested_by_id, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          token,
          member.id,
          applicationId,
          roundId,
          scheduledDate,
          currentUser.id,
          new Date(Date.now() + 24 * 60 * 60 * 1000) // Token expires in 24 hours
        ]
      );

      // Format date for email display
      const formattedDate = new Date(scheduledDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });

      const result = await sendMail(
        session.accessToken as string,
        member.email,
        `Interview Availability Request: ${round.round_name} for ${candidateName}`,
        `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
          <table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <tr>
              <td>
                <h2 style="color: #4527a0; text-align: center;">Interview Availability Request</h2>
                <p>Dear <strong>${member.name}</strong>,</p>
      
                <p>
                  You have been selected as a panel member for the <strong>${round.round_name}</strong> round of the interview process 
                  for candidate <strong>${candidateName}</strong> applying for the <strong>${jobTitle}</strong> position.
                </p>
      
                <p><strong>Scheduled Date:</strong> ${formattedDate}</p>
                ${meetingLocation ? `<p><strong>Location:</strong> ${meetingLocation}</p>` : ''}
                ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #1a73e8;">${meetingLink}</a></p>` : ''}
      
                <p>Please confirm your availability by selecting one of the options below:</p>
      
                <div style="margin: 20px 0; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=available"
                    style="display: inline-block; padding: 12px 20px; margin: 5px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px;">
                    I'm Available
                  </a>
      
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=unavailable"
                    style="display: inline-block; padding: 12px 20px; margin: 5px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">
                    I'm Not Available
                  </a>
                </div>
      
                <p style="font-size: 12px; color: #666;">If the buttons above don't work, you can use the following links:</p>
                <ul style="font-size: 12px; color: #666;">
                  <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=available">${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=available</a></li>
                  <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=unavailable">${process.env.NEXT_PUBLIC_APP_URL}/api/availability/confirm?token=${token}&response=unavailable</a></li>
                </ul>
      
                <p>Thank you for your prompt response.</p>
                <p>Best regards,<br><strong>${currentUser?.name || 'HR Team'}</strong></p>
              </td>
            </tr>
          </table>
        </div>
        `,
        [], // attachments
        "", // cc
        "HTML"
      );
      
      if (!result.success) {
        console.error("Failed to send email", result.error);
        return NextResponse.json(
          { success: false, message: "Failed to send email" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Availability check emails sent' });
  } catch (error) {
    console.error('Error checking availability:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}