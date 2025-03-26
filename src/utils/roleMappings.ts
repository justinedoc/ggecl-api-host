import { Model } from "mongoose";
import instructorModel, { IInstructor } from "../models/instructorModel.js";
import studentModel, { IStudent } from "../models/studentModel.js";

export type UserRole = "student" | "instructor";

export type RoleConfig = {
  student: { model: Model<IStudent> };
  instructor: { model: Model<IInstructor> };
};

export const roleMappings: RoleConfig = {
  student: { model: studentModel },
  instructor: { model: instructorModel },
};

export const combinedUserModel = (role: UserRole) =>
  roleMappings[role].model as Model<IStudent | IInstructor>;
