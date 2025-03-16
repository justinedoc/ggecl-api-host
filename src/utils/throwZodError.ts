import { Response } from "express";
import { z } from "zod";

function throwZodError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }
}

export default throwZodError;
