// src/features/auth/controllers/googleAuthController.ts
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { envConfig } from "../../config/envValidator.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../../utils/responseUtils.js";
import { setRefreshTokenCookie } from "../../utils/cookieUtils.js";
import { instructorAuthService as authService } from "../../services/instructorAuth.js";
import { IInstructor } from "../../models/instructorModel.js";

// Zod validation schema
const GoogleAuthSchema = z.object({
  idToken: z.string().min(100),
});

// Google client setup
const client = new OAuth2Client(envConfig.googleClientId);

export const handleGoogleAuth = async (req: Request, res: Response) => {
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

    // Check existing user
    const existingUser = await authService.findInstructorByEmail(email);

    const authResult = existingUser
      ? await handleGoogleLogin(existingUser)
      : await handleGoogleSignup(email, name!, picture!);

    // Set refresh token in secure cookie
    setRefreshTokenCookie(res, authResult.refreshToken);

    createSuccessResponse(res, 200, "Account creation sucessful", {
      message: authResult.message,
      user: authResult.instructor,
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

    console.error("Google authentication error:", error);
    createErrorResponse(res, 500, "Authentication failed");
  }
};

// Google Signup Handler
const handleGoogleSignup = async (
  email: string,
  name: string,
  picture: string
) => {
  try {
    const instructor = await authService.createInstructor({
      email,
      fullName: name,
      picture,
      googleSignIn: true,
    });

    const { accessToken, refreshToken } = authService.generateAuthTokens(
      instructor._id as string
    );

    await authService.updateRefreshToken(
      instructor._id as string,
      refreshToken
    );

    return {
      message: "Account created successfully",
      instructor,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Google signup error:", error);
    throw new Error("Failed to create user account");
  }
};

// Google Login Handler
const handleGoogleLogin = async (instructor: IInstructor) => {
  try {
    const { accessToken, refreshToken } = authService.generateAuthTokens(
      instructor._id as string
    );

    // Update refresh token
    await authService.updateRefreshToken(
      instructor._id as string,
      refreshToken
    );

    return {
      message: "Login successful",
      instructor,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Google login error:", error);
    throw new Error("Failed to process login");
  }
};
