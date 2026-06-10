import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { sendMailViaSMTP } from "@/lib/mail/mail-transporter-smtp";
// Alternative: import { sendMailFromServiceAccount } from "@/lib/mail/mail-transporter-app";

interface EmailRequestBody {
  to: string;
  cc?: string | string[];
  subject: string;
  text: string;
  attachments?: { filename: string; content: string | Buffer }[];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('📨 [contact-candidate] Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
    });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EmailRequestBody = await req.json();
    const { to, cc, subject, text, attachments } = body;

    if (!to || !subject || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const processedAttachments = attachments?.map((attachment) => ({
      ...attachment,
      content: typeof attachment.content === "string" ? Buffer.from(attachment.content.split(',')[1], 'base64') : attachment.content,
    }));

    console.log('📤 [contact-candidate] Sending email via SMTP');
    const result = await sendMailViaSMTP(to, subject, text, processedAttachments, cc);
    
    // Alternative: Use Microsoft Graph with Application permissions
    // const result = await sendMailFromServiceAccount(to, subject, text, processedAttachments, cc);

    if (result.success) {
      console.log('✅ [contact-candidate] Email sent successfully');
      return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
    } else {
      console.error('❌ [contact-candidate] sendMail failed:', result.error);
      return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ [contact-candidate] Error:', err.message);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
