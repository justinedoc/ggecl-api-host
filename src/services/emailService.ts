import { Model } from "mongoose";
import crypto from "crypto";
import Student, { IStudent } from "../models/studentModel.js";
import Instructor, { IInstructor } from "../models/instructorModel.js";
import { sendVerificationToEmail } from "./sendVerificationToEmail.js";
import { envConfig } from "../config/envValidator.js";
import { z } from "zod";

// Schemas for validation
export const verifyEmailSchema = z.object({
  token: z.string().length(128).regex(/^[a-f0-9]+$/i),
  role: z.enum(["student", "instructor"]),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["student", "instructor"]),
});

interface VerificationTokenPayload {
  token: string;
  expires: Date;
}

const TOKEN_EXPIRATION_MINUTES = 10;
const TOKEN_BYTES = 40;

type ModelMappingType = {
  student: Model<IStudent>;
  instructor: Model<IInstructor>;
};

const Models: ModelMappingType = {
  student: Student,
  instructor: Instructor,
};

// The role type
type UserRole = "student" | "instructor";

export const emailService = (role: UserRole) => {
  const UserModel = Models[role] as Model<IStudent | IInstructor>;

  const generateVerificationToken = (): VerificationTokenPayload => ({
    token: crypto.randomBytes(TOKEN_BYTES).toString("hex"),
    expires: new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000),
  });

  const constructVerificationLink = (token: string): string =>
    `${envConfig.verifyEmailBaseUrl}?token=${token}`;

  async function initiateEmailVerification(userId: string, email: string) {
    try {
      const { token, expires } = generateVerificationToken();

      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          emailVerificationToken: token,
          emailVerificationExpires: expires,
        },
        { new: true, runValidators: true }
      ).select("+emailVerificationToken +emailVerificationExpires");

      if (!user) {
        throw new Error("User not found");
      }

      const result = await sendVerificationToEmail({
        username: user.fullName || user.email,
        toEmail: email,
        verificationLink: constructVerificationLink(token),
      });

      return result;
    } catch (error) {
      console.error(`Email verification initiation failed for ${role}:`, error);
      throw new Error("Failed to initiate email verification");
    }
  }

  async function verifyEmailToken(token: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) return false;

      await UserModel.findByIdAndUpdate(user._id, {
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
        },
        $set: { emailVerified: true },
      });

      return true;
    } catch (error) {
      console.error(`Email verification failed for ${role}:`, error);
      return false;
    }
  }

  return {
    initiateEmailVerification,
    verifyEmailToken,
  };
};
