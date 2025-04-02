import { Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "express-async-handler";

import { studentAuthService } from "../../services/studentAuth.js";
import { IStudent } from "../../models/studentModel.js";
import { setRefreshTokenCookie } from "../../utils/cookieUtils.js";
import {
  StudentLoginSchema,
  StudentRegistrationSchema,
} from "./authSchemas.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
} from "../../utils/responseUtils.js";
import { emailService } from "../../services/emailService.js";

// Reusable Auth Service

// Common Response Formatters
const formatAuthResponse = (student: IStudent, accessToken: string) => ({
  student: {
    studentId: student._id,
    email: student.email,
    fullName: student.fullName,
    gender: student.gender,
  },
  accessToken,
});

// Registration Handler
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { initiateEmailVerification } = emailService("student");

  try {
    const validatedData = await StudentRegistrationSchema.parseAsync(req.body);

    const existingStudent = await studentAuthService.findStudentByEmail(
      validatedData.email
    );
    if (existingStudent) {
      createErrorResponse(res, 409, "Email is already registered");
      return;
    }

    const student = await studentAuthService.createStudent(validatedData);
    const { accessToken, refreshToken } = studentAuthService.generateAuthTokens(
      student._id as string
    );

    await studentAuthService.updateRefreshToken(
      student._id as string,
      refreshToken
    );

    setRefreshTokenCookie(res, refreshToken);

    await initiateEmailVerification(student._id as string, student.email);

    createSuccessResponse(
      res,
      201,
      "Registration successful",
      formatAuthResponse(student, accessToken)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error("Student registration error:", error);
    createErrorResponse(res, 500, error.message || "Internal server error");
  }
});

// Login Handler
export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = await StudentLoginSchema.parseAsync(req.body);

    const student = await studentAuthService.findStudentByEmail(
      validatedData.email
    );
    if (!student) {
      createErrorResponse(res, 401, "Incorrect email or password");
      return;
    }

    const isValidPassword = await studentAuthService.validatePassword(
      validatedData.password,
      student.password
    );

    if (!isValidPassword) {
      createErrorResponse(res, 401, "Incorrect email or password");
      return;
    }

    const { accessToken, refreshToken } = studentAuthService.generateAuthTokens(
      student._id as string
    );

    await studentAuthService.updateRefreshToken(
      student._id as string,
      refreshToken
    );
    setRefreshTokenCookie(res, refreshToken);

    createSuccessResponse(
      res,
      200,
      "Login successful",
      formatAuthResponse(student, accessToken)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error("Student login error:", error);
    createErrorResponse(res, 500, "Internal server error");
  }
});
