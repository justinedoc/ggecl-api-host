import { envConfig } from "../config/envValidator.js";
import { transporter } from "./mailer.js";

interface SendVerificationToEmailParams {
  toEmail: string;
  username: string;
  verificationLink: string;
  html?: string;
  message: string;
  subject: string;
}

export async function sendVerificationToEmail({
  toEmail,
  html,
  message,
  subject,
}: SendVerificationToEmailParams) {
  const mailOptions = {
    from: envConfig.emailAddr,
    to: toEmail,
    subject,
    html,
    text: message,
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
