import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose, { isValidObjectId } from "mongoose";
import Student from "../../models/studentModel.js";
import NodeCache from "node-cache";
import { z } from "zod";
import { AuthenticatedRequest } from "../../types/express.js";

const cache = new NodeCache({ stdTTL: 600 });

const StudentEditableSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender selected is not valid" }),
  }),
  picture: z.string().url(),
});

const StudentUpdateSchema = StudentEditableSchema.partial();

type StudentEditable = z.infer<typeof StudentEditableSchema>;

// const getCacheKey = (req: Request) => {
//   const { page, limit, search, sortBy, order } = req.query;
//   return `students-${page}-${limit}-${search}-${sortBy}-${order}`;
// };

function wildcardDeleteCache(start: string) {
  const keys = cache.keys();
  const startKeys = keys.filter((key) => key.startsWith(start));
  cache.del(startKeys);
}

export const getStudentById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid student ID" });
      return;
    }

    const cachedStudent = cache.get(`student-${id}`);

    if (cachedStudent) {
      res.json({ success: true, fromCache: true, data: cachedStudent });
      return;
    }

    try {
      const student = await Student.findById(id).select("-password").lean().exec();

      if (!student) {
        res.status(404).json({ message: "Student not found" });
        return;
      }

      cache.set(`student-${id}`, student);

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      console.error(error);

      if (error instanceof mongoose.Error.CastError) {
        res.status(400);
        throw new Error("Invalid student ID");
      }

      res.status(500);
      throw new Error("Something went wrong");
    }
  }
);

export const updateStudent = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, StudentEditable>,
    res: Response
  ) => {
    const id = req.params.id;
    const studentId = req.user.id;

    // Authorization check
    if (id !== studentId) {
      res.status(403);
      throw new Error("Not authorized to update this student");
    }

    // Validate ID
    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid student ID format");
    }

    // Zod validation
    const validatedData = StudentUpdateSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400);
      throw new Error(validatedData.error.errors[0]?.message);
    }

    // Check for empty update body
    if (Object.keys(validatedData.data).length === 0) {
      res.status(400);
      throw new Error("No valid fields provided for update");
    }

    // Update student
    const student = await Student.findByIdAndUpdate(id, validatedData.data, {
      new: true,
      runValidators: true,
    })
      .select("-refreshToken -password")
      .lean()
      .exec();

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    // Clear cache
    cache.del(`student-${id}`);
    wildcardDeleteCache("students-");

    res.json({ success: true, data: student });
  }
);
