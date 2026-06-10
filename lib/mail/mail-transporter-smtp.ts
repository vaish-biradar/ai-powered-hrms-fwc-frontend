import nodemailer from 'nodemailer';

export const sendMailViaSMTP = async (
  to: string | string[],
  subject: string,
  text: string,
  attachments?: { filename: string; content: Buffer }[],
  cc?: string | string[],
  html?: string
) => {
  try {
    console.log('📧 [sendMailViaSMTP] Starting with:', {
      to: Array.isArray(to) ? to : [to],
      subject,
    });

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const recipients = Array.isArray(to) ? to.join(',') : to;
    const ccRecipients = cc ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined;

    const mailOptions: any = {
      from: `HR FWC <${process.env.GMAIL_USERNAME}>`,
      to: recipients,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    if (ccRecipients) {
      mailOptions.cc = ccRecipients;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
      }));
    }

    console.log('🚀 [sendMailViaSMTP] Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ [sendMailViaSMTP] Email sent successfully');

    return { success: true };
  } catch (error: any) {
    console.error('❌ [sendMailViaSMTP] Error:', {
      message: error?.message,
      code: error?.code,
    });
    return { success: false, error };
  }
};
