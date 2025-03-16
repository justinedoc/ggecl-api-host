import nodemailer from "nodemailer";
import { envConfig } from "../config/envValidator.js";

export const transporter = nodemailer.createTransport({
  host: envConfig.smtpHost,
  port: 587,
  auth: {
    user: envConfig.smtpUser,
    pass: envConfig.smtpPass,
  },
});
