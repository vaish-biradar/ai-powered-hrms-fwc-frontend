import { NextResponse } from "next/server";
import { insertItem } from "@/lib/storage/cosmos-utils";
import { sendMail } from "@/lib/mail/mail-transporter";
import crypto from "crypto";

const INVITATION_EXPIRY_HOURS = 48;

export async function POST(req: Request) {
  try {
    const {
      email,
      name,
      department,
      role,
      panel,
      panelName,
      expertiseInput,
      message,
      accessToken, // Microsoft Graph token should be passed from the client or fetched via server-side auth
    } = await req.json();

    // Generate secure token
    const invitation_token = crypto.randomBytes(32).toString("hex");
    const invitation_expiry = new Date(
      Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString();

    // Insert into database
    const newMember = await insertItem("members", {
      name,
      email,
      department,
      role,
      expertise: expertiseInput,
      invitation_token,
      invitation_expiry,
    });

    // Create invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailHtml = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Join Panel</title>
  <style type="text/css">
    /* Reset styles */
    body, p, td, div, span {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
    }
    /* Responsive design */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .button {
        display: block !important;
        width: 100% !important;
        margin: 10px 0 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 30px 0; background-color: #6200ea; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <img src="/assets/logos/logo-white.png" alt="Company Logo" style="display: block; max-width: 150px; height: auto;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                <tr>
                  <td>
                    <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">Hi ${name},</p>
                    <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                      You have been invited to join the <strong style="color: #6200ea;">${panelName}</strong> panel.
                    </p>
                    ${message ? `<p style="margin: 0 0 20px; font-size: 16px; color: #333333; background-color: #f5f5f5; padding: 15px; border-left: 4px solid #6200ea; border-radius: 4px;"><em>Message from admin:</em><br>${message}</p>` : ""}
                    <p style="margin: 0 0 30px; font-size: 16px; color: #333333;">Please respond to your invitation within <strong>${INVITATION_EXPIRY_HOURS} hours</strong>.</p>
                    
                    <!-- Buttons -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                            <tr>
                              <td class="button" align="center" style="border-radius: 50px; background-color: #76ff03;">
                                <a href="${baseUrl}/invitation/respond?token=${invitation_token}&panel=${panel}&action=accept" 
                                   style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #000000; text-decoration: none; font-weight: bold;">
                                  Accept Invitation
                                </a>
                              </td>
                              <td width="20"></td>
                              <td class="button" align="center" style="border-radius: 50px; background-color: #f5f5f5;">
                                <a href="${baseUrl}/invitation/respond?token=${invitation_token}&action=reject" 
                                   style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #333333; text-decoration: none; font-weight: bold;">
                                  Decline
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0; font-size: 16px; color: #333333;">Thank you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: 0; height: 1px; background-color: #e0e0e0; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f5f5f5; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                      This is an automated email. Please do not reply.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      © 2025 <a href="https://www.fwc.co.in"> FWC </a>. All rights reserved.
                    </p>
                 
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
    // Compose email


    // Send email
    const result = await sendMail(
      accessToken,
      email,
      "You are invited to join an interview panel",
      emailHtml, // This is now HTML

        [], // No attachments
        "", // No CC recipients
        "HTML" // Set content type to HTML
    );

    if (!result.success) {
      console.error("Failed to send email", result.error);
      return NextResponse.json(
        { success: false, message: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      member: newMember,
    });
  } catch (err) {
    console.error("Error sending invitation:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
