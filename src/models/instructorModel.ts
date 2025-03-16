import { Document, Schema, Types, model } from "mongoose";
import { Review, ReviewSchema } from "./reviewSchema.js";

// Interface for Instructor Notification subdocument
interface IInstructorNotification extends Document {
  title: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

// Main Instructor interface
export interface IInstructor extends Document {
  fullName: string;
  dateOfBirth?: Date;
  gender: string;
  picture: string;
  username: string;
  googleSignIn: boolean;
  emailVerified: boolean;
  isVerified: boolean;
  email: string;
  password?: string;
  notifications: IInstructorNotification[];
  refreshToken?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  reviews: Review[];
  students: Types.ObjectId[];
  courses: Types.ObjectId[];
  bio: string;
  topics: string[];
}

// Instructor Notification Schema
const InstructorNotificationSchema = new Schema<IInstructorNotification>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

// Main Instructor Schema
export const InstructorSchema = new Schema<IInstructor>(
  {
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, default: "other" },
    picture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    username: { type: String, unique: true, sparse: true },
    googleSignIn: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    notifications: { type: [InstructorNotificationSchema], default: [] },
    refreshToken: { type: String },
    reviews: { type: [ReviewSchema], default: [] },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "student",
        default: [],
      },
    ],
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "course",
        default: [],
      },
    ],
    bio: { type: String, default: "" },
    topics: { type: [String], default: [] },
  },
  { timestamps: true }
);

InstructorSchema.pre("save", async function (next) {
  if (!this.username && this.email) {
    const baseUsername = this.email.split("@")[0];
    let counter = 1;
    let uniqueUsername = baseUsername;

    // Check for existing username
    while (await model("instructor").exists({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${counter++}`;
    }
    this.username = uniqueUsername;
  }

  if (!this.googleSignIn && !this.password) {
    return next(new Error("Password is required for email/password signups"));
  }

  if (this.googleSignIn) {
    this.emailVerified = true;
  }

  next();
});

export default model<IInstructor>("instructor", InstructorSchema);
