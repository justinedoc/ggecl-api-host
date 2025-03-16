import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.js";
import { authenticator } from "../middlewares/authenticator.js";
import { isRole } from "../middlewares/isRole.js";

const router = Router();

router.post("/new", authenticator, isRole("instructor"), createCourse);
router.put("/:id", authenticator, isRole("instructor"), updateCourse);
router.delete("/:id", authenticator, isRole("instructor"), deleteCourse);

router.get("/all", getCourses);
router.get("/:id", getCourseById);

export default router;
