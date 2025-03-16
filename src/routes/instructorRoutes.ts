import express from "express";
import { authenticator } from "../middlewares/authenticator.js";
import { register, login, logout } from "../controllers/instructors/auth.js";

import {
  getInstructorById,
  updateInstructor,
} from "../controllers/instructors/index.js";
import { handleGoogleAuth } from "../controllers/instructors/googleAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/google/auth", handleGoogleAuth)

router.put("/:id", authenticator, updateInstructor);

router.get("/:id", getInstructorById);

export default router;
