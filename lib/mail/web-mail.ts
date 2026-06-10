import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_SERVER || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.GMAIL_USERNAME || process.env.EMAIL_USER;
const smtpPass = process.env.GMAIL_PASSWORD || process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const contactSenderEmail = smtpUser;

export default transporter;