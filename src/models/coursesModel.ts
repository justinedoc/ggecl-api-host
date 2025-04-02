import { Schema, model, Document, Types } from "mongoose";
import { type Review, ReviewSchema } from "./reviewSchema.js";

export interface ICourse extends Document {
  title: string;
  instructor: Types.ObjectId;
  description: string;
  certification: string;
  syllabus: string[]; 
  reviews: Review[];
  totalRating: number;
  totalStar: number;
  duration: string;
  lectures: number;
  level: string;
  price: number;
  img: string;
}

export const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true, unique: true },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: "instructor",
    required: true,
  },
  description: { type: String, required: true },
  certification: { type: String, required: true },
  syllabus: { type: [String], default: [] },
  reviews: { type: [ReviewSchema], default: [] },
  totalRating: { type: Number, required: true },
  totalStar: { type: Number, required: true },
  duration: { type: String, required: true },
  lectures: { type: Number, required: true },
  level: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
});

export default model<ICourse>("course", CourseSchema);
