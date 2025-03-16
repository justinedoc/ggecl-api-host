import bcrypt from "bcrypt";
import { z } from "zod";

import Instructor from "../models/instructorModel.js";
import { InstructorRegistrationSchema } from "../controllers/instructors/authSchemas.js";
import { generateToken } from "../utils/generateToken.js";
import { InstructorWelcomeMessage } from "../constants/messages.js";
import { SALT_ROUNDS } from "../constants/auth.js";

type InstructorRegisterType = z.infer<typeof InstructorRegistrationSchema>;

export const instructorAuthService = {
  findInstructorByEmail: async (email: string) => {
    return Instructor.findOne({ email });
  },

  createInstructor: async (data: InstructorRegisterType) => {
    const password = data?.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : undefined;

    return Instructor.create({
      ...data,
      password,
      notifications: [InstructorWelcomeMessage],
    });
  },

  updateRefreshToken: async (instructorId: string, refreshToken: string) => {
    return Instructor.findByIdAndUpdate(
      instructorId,
      { refreshToken },
      { runValidators: true }
    );
  },

  clearRefreshToken: async (instructorId: string) => {
    return Instructor.findByIdAndUpdate(
      instructorId,
      { $unset: { refreshToken: "" } },
      { runValidators: true }
    );
  },

  validatePassword: async (password: string, hashedPassword: string) => {
    return bcrypt.compare(password, hashedPassword);
  },

  generateAuthTokens: (instructorId: string) => ({
    accessToken: generateToken({
      id: instructorId,
      type: "accessToken",
      role: "instructor",
    }),
    refreshToken: generateToken({
      id: instructorId,
      type: "refreshToken",
      role: "instructor",
    }),
  }),
};
