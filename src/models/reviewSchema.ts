import { Schema } from "mongoose";

export interface Review {
  rating: number;
  reviewer: string;
  date: Date;
  comment: string;
  image: string;
  stars: number;
}

export const ReviewSchema = new Schema<Review>(
  {
    rating: { type: Number, required: true },
    reviewer: { type: String, required: true },
    date: { type: Date, required: true },
    comment: { type: String, required: true },
    image: { type: String, required: true },
    stars: { type: Number, required: true },
  },
  { _id: false }
);
