import express from "express";
import { register, login, logout } from "../controllers/students/auth.js";
import {
  getStudentById,
  updateStudent,
} from "../controllers/students/index.js";
import { authenticator } from "../middlewares/authenticator.js";
import { handleStudentGoogleAuth } from "../controllers/students/googleAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/google/auth", handleStudentGoogleAuth);

router.put("/:id", authenticator, updateStudent);

router.get("/:id", getStudentById);

export default router;
