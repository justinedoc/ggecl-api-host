import { Schema, Document } from "mongoose";

export interface ICart extends Document {
  title: string;
  instructor: string;
  totalRating: number;
  totalStar: number;
  duration: string;
  lectures: number;
  level: string;
  price: number;
  img: string;
}

export const CartSchema = new Schema<ICart>({
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  totalRating: { type: Number, default: 0 },
  totalStar: { type: Number, default: 0 },
  duration: { type: String, required: true },
  lectures: { type: Number, required: true },
  level: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
});
