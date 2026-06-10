import { NextResponse } from "next/server";
import transporter, { contactSenderEmail } from "@/lib/mail/web-mail";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const senderEmail = contactSenderEmail;

    if (!process.env.EMAIL_RECIPIENTS) {
      return NextResponse.json({ success: false, error: "Email configuration is missing" }, { status: 500 });
    }

    if (!senderEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Sender email is not configured. Set GMAIL_USERNAME/GMAIL_PASSWORD (or EMAIL_USER/EMAIL_PASS).",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { name, email, company, message } = body;
    const recipients = process.env.EMAIL_RECIPIENTS.split(",").map(email => email.trim());

    if (recipients.length === 0 || !recipients[0]) {
      return NextResponse.json({ success: false, error: "No valid email recipients provided" }, { status: 500 });
    }



    const mailOptions = {
      from: `Website Contact <${senderEmail}>`,
      to: recipients,
      subject: `New Contact Form Submission from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Company: ${company || "N/A"}
Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Email sent successfully!" });
  } catch (error: any) {
    console.error("Email sending error:", error);

    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SMTP authentication failed. For Gmail, use GMAIL_USERNAME and a valid Google App Password in GMAIL_PASSWORD.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
