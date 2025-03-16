import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose, { isValidObjectId } from "mongoose";
import Instructor from "../../models/instructorModel.js";
import NodeCache from "node-cache";
import { z } from "zod";
import { AuthenticatedRequest } from "../../types/express.js";

const cache = new NodeCache({ stdTTL: 600 });

const InstructorEditableSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender selected is not valid" }),
  }),
  picture: z.string().url(),
  bio: z.string().min(5, "Bio must be at least 5 characters"),
  topics: z.array(z.string()),
});

const InstructorUpdateSchema = InstructorEditableSchema.partial();

type InstructorEditable = z.infer<typeof InstructorEditableSchema>;

// const getCacheKey = (req: Request) => {
//   const { page, limit, search, sortBy, order } = req.query;
//   return `instructors-${page}-${limit}-${search}-${sortBy}-${order}`;
// };

function wildcardDeleteCache(start: string) {
  const keys = cache.keys();
  const startKeys = keys.filter((key) => key.startsWith(start));
  cache.del(startKeys);
}

export const getInstructorById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid instructor ID" });
      return;
    }

    const cachedInstructor = cache.get(`instructor-${id}`);

    if (cachedInstructor) {
      res.json({ success: true, fromCache: true, data: cachedInstructor });
      return;
    }

    try {
      const instructor = await Instructor.findById(id)
        .populate("courses", "title image")
        .populate("students", "name email")
        .lean()
        .exec();

      if (!instructor) {
        res.status(404).json({ message: "Instructor not found" });
        return;
      }

      cache.set(`instructor-${id}`, instructor);

      res.json({
        success: true,
        data: instructor,
      });
    } catch (error) {
      console.error(error);

      if (error instanceof mongoose.Error.CastError) {
        res.status(400);
        throw new Error("Invalid instructor ID");
      }

      res.status(500);
      throw new Error("Something went wrong");
    }
  }
);

export const updateInstructor = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, InstructorEditable>,
    res: Response
  ) => {
    const id = req.params.id;
    const instructorId = req.user.id;

    // Authorization check
    if (id !== instructorId) {
      res.status(403);
      throw new Error("Not authorized to update this instructor");
    }

    // Validate ID
    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid instructor ID format");
    }

    // Zod validation
    const validatedData = InstructorUpdateSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400);
      throw new Error(validatedData.error.errors[0]?.message);
    }

    // Check for empty update body
    if (Object.keys(validatedData.data).length === 0) {
      res.status(400);
      throw new Error("No valid fields provided for update");
    }

    // Update instructor
    const instructor = await Instructor.findByIdAndUpdate(
      id,
      validatedData.data,
      { new: true, runValidators: true }
    )
      .populate("courses", "title")
      .select("-refreshToken -password")
      .lean()
      .exec();

    if (!instructor) {
      res.status(404);
      throw new Error("Instructor not found");
    }

    // Clear cache
    cache.del(`instructor-${id}`);
    wildcardDeleteCache("instructors-");

    res.json({ success: true, data: instructor });
  }
);
