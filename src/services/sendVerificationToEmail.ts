import { envConfig } from "../config/envValidator.js";
import {
  VERIFY_EMAIL_SUBJECT,
  VERIFY_EMAIL_TEXT,
} from "../constants/messages.js";
import { verifyEmailHtml } from "../constants/verifyEmailHtml.js";
import { transporter } from "./mailer.js";

interface SendVerificationToEmailParams {
  toEmail: string;
  username: string;
  verificationLink: string;
}

export async function sendVerificationToEmail({
  username,
  toEmail,
  verificationLink,
}: SendVerificationToEmailParams) {
  const mailOptions = {
    from: envConfig.emailAddr,
    to: toEmail,
    subject: VERIFY_EMAIL_SUBJECT,
    html: verifyEmailHtml(username, verificationLink),
    text: VERIFY_EMAIL_TEXT(verificationLink),
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
    return result;
  } catch (error) {
    console.error(`Error sending verification email to ${toEmail}:`, error);
    throw error;
  }
}
