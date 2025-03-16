import { Request, Response } from "express";
import mongoose, { FilterQuery, isValidObjectId } from "mongoose";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import NodeCache from "node-cache";
import Course, { ICourse } from "../models/coursesModel.js";
import { model } from "mongoose";

// Initialize cache with 10-minute TTL
const cache = new NodeCache({ stdTTL: 600 });

// Zod Schemas
const CourseInputSchema = z.object({
  title: z.string().min(3).max(100),
  instructor: z.string().refine((val) => isValidObjectId(val), {
    message: "Invalid instructor ID format",
  }),
  description: z.string().min(10),
  certification: z.string().min(3),
  syllabus: z.array(z.string()).optional().default([]),
  duration: z.string().min(1),
  lectures: z.number().int().positive(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  price: z.number().positive(),
  img: z.string().url(),
  totalRating: z.number().min(0).default(0),
  totalStar: z.number().min(0).default(0),
});

const CourseUpdateSchema = CourseInputSchema.partial();

type CourseInput = z.infer<typeof CourseInputSchema>;
type CourseUpdateInput = z.infer<typeof CourseUpdateSchema>;

// helper func
const getCacheKey = (req: Request) => {
  const { page, limit, search, sortBy, order } = req.query;
  return `courses-${page}-${limit}-${search}-${sortBy}-${order}`;
};

function deleteAllCoursesCache(startWith: string) {
  const keys = cache.keys();
  const courseKeys = keys.filter((key) => key.startsWith(startWith));
  cache.del(courseKeys);
}

/**
 * Create a new course with Zod validation
 */
export const createCourse = asyncHandler(
  async (req: Request<object, object, CourseInput>, res: Response) => {
    const validationResult = CourseInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400);
      throw new Error(validationResult.error.errors[0]?.message);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const instructorId = validationResult.data.instructor;

      const instructorExists = await model("instructor").exists({
        _id: instructorId,
      });
      if (!instructorExists) {
        res.status(404);
        throw new Error("Instructor not found");
      }

      const course = await Course.create([validationResult.data], { session });

      await model("instructor").findByIdAndUpdate(
        instructorId,
        { $push: { courses: course[0]._id } },
        { session, new: true }
      );

      await session.commitTransaction();

      // Clear relevant caches
      deleteAllCoursesCache("courses-");

      const populatedCourse = await Course.findById(course[0]._id).populate(
        "instructor",
        "fullName email"
      );

      res.status(201).json({
        success: true,
        data: populatedCourse,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
);

/**
 * Get paginated and filtered courses with caching
 */
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = getCacheKey(req);
  const cachedData = cache.get(cacheKey) as Record<string, unknown> | null;

  if (cachedData) {
    res.json({
      success: true,
      fromCache: true,
      ...cachedData,
    });
    return;
  }

  // Pagination
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  // Query building
  const query: FilterQuery<ICourse> = {};
  if (req.query.search) {
    const search = req.query.search as string;
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  const sortOptions: Record<string, 1 | -1> = {};
  if (req.query.sortBy) {
    const order = req.query.order === "desc" ? -1 : 1;
    sortOptions[req.query.sortBy as string] = order;
  }

  // Data fetching
  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate("instructor", "fullName picture")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
  ]);

  // Prepare response
  const response = {
    data: courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  // Cache the response
  cache.set(cacheKey, response);

  res.json({ success: true, ...response });
});

/**
 * Get single course by ID with caching
 */
export const getCourseById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const cacheKey = `course-${req.params.id}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.json({ success: true, fromCache: true, data: cachedData });
      return;
    }

    if (!isValidObjectId(req.params.id)) {
      res.status(400);
      throw new Error("Invalid course ID format");
    }

    const course = await Course.findById(req.params.id)
      .populate("instructor", "fullName bio picture")
      .populate("reviews");

    if (!course) {
      res.status(404);
      throw new Error("Course not found");
    }

    // Cache the course data
    cache.set(cacheKey, course.toObject());

    res.json({ success: true, data: course });
  }
);

/**
 * Update course by ID with Zod validation
 */
export const updateCourse = asyncHandler(
  async (
    req: Request<{ id: string }, object, CourseUpdateInput>,
    res: Response
  ) => {
    // Validate ID
    if (!isValidObjectId(req.params.id)) {
      res.status(400);
      throw new Error("Invalid course ID format");
    }

    // Zod validation
    const validationResult = CourseUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400);
      throw new Error(validationResult.error.errors[0]?.message);
    }

    // Update course
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      validationResult.data,
      { new: true, runValidators: true }
    ).populate("instructor", "fullName");

    if (!course) {
      res.status(404);
      throw new Error("Course not found");
    }

    // Clear relevant cache
    cache.del(`course-${req.params.id}`);
    deleteAllCoursesCache("courses-"); // Clear all courses lists

    res.json({ success: true, data: course });
  }
);

/**
 * Delete course by ID
 */
export const deleteCourse = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      res.status(400);
      throw new Error("Invalid course ID format");
    }

    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error("Course not found");
    }

    // Clear relevant cache
    cache.del(`course-${req.params.id}`);
    deleteAllCoursesCache("courses-"); // Clear all courses lists

    res.json({
      success: true,
      data: { message: "Course deleted successfully" },
    });
  }
);
