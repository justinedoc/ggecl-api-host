/* eslint-disable @typescript-eslint/no-explicit-any */
// responseUtils.ts
import { Response } from "express";
import { ZodError } from "zod";

export const createSuccessResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const createErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown[]
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || [],
  });
};

export const handleZodError = (res: Response, error: ZodError) => {
  const errors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  res.status(400).json({
    success: false,
    message: "Validation failed",
    error: null,
    errors,
  });
};
