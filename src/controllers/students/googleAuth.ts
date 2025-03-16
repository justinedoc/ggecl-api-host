// src/features/auth/controllers/studentGoogleAuthController.ts
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { envConfig } from "../../config/envValidator.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../../utils/responseUtils.js";
import { setRefreshTokenCookie } from "../../utils/cookieUtils.js";
import { studentAuthService } from "../../services/studentAuth.js";
import { IStudent } from "../../models/studentModel.js";

// Zod validation schema
const GoogleAuthSchema = z.object({
  idToken: z.string().min(100),
});

// Google client setup
const client = new OAuth2Client(envConfig.googleClientId);

export const handleStudentGoogleAuth = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { idToken } = GoogleAuthSchema.parse(req.body);

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: envConfig.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email_verified || !payload.email) {
      return createErrorResponse(res, 401, "Google account not verified");
    }

    const { email, name, picture } = payload;

    // Check existing student
    const existingStudent = await studentAuthService.findStudentByEmail(email);

    const authResult = existingStudent
      ? await handleStudentGoogleLogin(existingStudent)
      : await handleStudentGoogleSignup(email, name!, picture!);

    // Set refresh token in secure cookie
    setRefreshTokenCookie(res, authResult.refreshToken);

    createSuccessResponse(res, 200, "Authentication successful", {
      student: {
        _id: authResult.student._id,
        email: authResult.student.email,
        fullName: authResult.student.fullName,
        picture: authResult.student.picture,
      },
      accessToken: authResult.accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        res,
        400,
        "Invalid request data",
        error.errors
      );
    }

    console.error("Student Google authentication error:", error);
    createErrorResponse(res, 500, "Authentication failed");
  }
};

// Google Signup Handler
const handleStudentGoogleSignup = async (
  email: string,
  name: string,
  picture: string
) => {
  try {
    const student = await studentAuthService.createStudent({
      email,
      fullName: name,
      picture,
      googleSignIn: true,
    });

    const { accessToken, refreshToken } = studentAuthService.generateAuthTokens(
      student._id.toString()
    );

    await studentAuthService.updateRefreshToken(
      student._id.toString(),
      refreshToken
    );

    return {
      message: "Account created successfully",
      student,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Student Google signup error:", error);
    throw new Error("Failed to create student account");
  }
};

// Google Login Handler
const handleStudentGoogleLogin = async (student: IStudent) => {
  try {
    const { accessToken, refreshToken } = studentAuthService.generateAuthTokens(
      student._id.toString()
    );

    // Update refresh token
    await studentAuthService.updateRefreshToken(
      student._id.toString(),
      refreshToken
    );

    return {
      message: "Login successful",
      student,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Student Google login error:", error);
    throw new Error("Failed to process student login");
  }
};
