import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "express-async-handler";

import { instructorAuthService as authService } from "../../services/instructorAuth.js";

import Instructor, { IInstructor } from "../../models/instructorModel.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../../utils/cookieUtils.js";
import {
  InstructorLoginSchema,
  InstructorRegistrationSchema,
} from "./authSchemas.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
} from "../../utils/responseUtils.js";
import { emailService } from "../../services/emailService.js";

// Common Response Formatters
const formatAuthResponse = (instructor: IInstructor, accessToken: string) => ({
  instructor: {
    _id: instructor._id,
    email: instructor.email,
    fullName: instructor.fullName,
  },
  accessToken,
});

// Registration Handler
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { initiateEmailVerification } = emailService("instructor");

    try {
      const validatedData = await InstructorRegistrationSchema.parseAsync(
        req.body
      );

      const existingInstructor = await authService.findInstructorByEmail(
        validatedData.email
      );
      if (existingInstructor) {
        return createErrorResponse(res, 409, "Email is already registered");
      }

      const instructor = await authService.createInstructor(validatedData);
      const { accessToken, refreshToken } = authService.generateAuthTokens(
        instructor._id as string
      );

      await authService.updateRefreshToken(
        instructor._id as string,
        refreshToken
      );

      setRefreshTokenCookie(res, refreshToken);

      await initiateEmailVerification(
        instructor._id as string,
        instructor.email
      );

      createSuccessResponse(
        res,
        201,
        "Registration successful",
        formatAuthResponse(instructor, accessToken)
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(handleZodError(res, error));
      }
      console.error("Registration error:", error);
      createErrorResponse(res, 500, "Internal server error");
    }
  }
);

// Login Handler
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await InstructorLoginSchema.parseAsync(req.body);

      const instructor = await authService.findInstructorByEmail(
        validatedData.email
      );
      if (!instructor) {
        createErrorResponse(res, 403, "Incorrect email or password");
        return;
      }

      const isValidPassword = await authService.validatePassword(
        validatedData.password,
        instructor.password
      );

      if (!isValidPassword) {
        createErrorResponse(res, 403, "Incorrect email or password");
        return;
      }

      const { accessToken, refreshToken } = authService.generateAuthTokens(
        instructor._id as string
      );

      await authService.updateRefreshToken(
        instructor._id as string,
        refreshToken
      );

      setRefreshTokenCookie(res, refreshToken);

      createSuccessResponse(
        res,
        200,
        "Login successful",
        formatAuthResponse(instructor, accessToken)
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(handleZodError(res, error));
        return;
      }
      console.error("Login error:", error);
      createErrorResponse(res, 500, "Internal server error");
    }
  }
);

// Logout Handler
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.session;
  if (!refreshToken) {
    res.sendStatus(204);
    return;
  }

  try {
    const instructor = await Instructor.findOne({ refreshToken });
    if (instructor) {
      await authService.clearRefreshToken(instructor._id as string);
    }

    clearRefreshTokenCookie(res);
    res.sendStatus(200);
  } catch (error) {
    console.error("Logout error:", error);
    createErrorResponse(res, 500, "Internal server error");
  }
});
