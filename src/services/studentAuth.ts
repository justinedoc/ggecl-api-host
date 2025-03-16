import bcrypt from "bcrypt";
import { z } from "zod";

import StudentModel, { IStudent } from "../models/studentModel.js";
import { StudentWelcomeMessage } from "../constants/messages.js";
import { generateToken } from "../utils/generateToken.js";
import { SALT_ROUNDS } from "../constants/auth.js";
import { StudentRegistrationSchema } from "../controllers/students/authSchemas.js";

type StudentRegisterType = z.infer<typeof StudentRegistrationSchema>;

export const studentAuthService = {
  findStudentByEmail: async (email: string) => {
    return StudentModel.findOne({ email });
  },

  createStudent: async (data: StudentRegisterType): Promise<IStudent> => {
    const password = data?.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : undefined;

    return StudentModel.create({
      ...data,
      password,
      notifications: [StudentWelcomeMessage],
    });
  },

  updateRefreshToken: async (studentId: string, refreshToken: string) => {
    return StudentModel.findByIdAndUpdate(
      studentId,
      { refreshToken },
      { runValidators: true }
    );
  },

  clearRefreshToken: async (studentId: string) => {
    return StudentModel.findByIdAndUpdate(
      studentId,
      { $unset: { refreshToken: 1 } },
      { runValidators: true }
    );
  },

  validatePassword: async (password: string, hashedPassword: string) => {
    return bcrypt.compare(password, hashedPassword);
  },

  generateAuthTokens: (studentId: string) => ({
    accessToken: generateToken({
      id: studentId,
      type: "accessToken",
      role: "student",
    }),
    refreshToken: generateToken({
      id: studentId,
      type: "refreshToken",
      role: "student",
    }),
  }),
};
