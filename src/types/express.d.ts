import { Request } from "express";

export interface AuthenticatedRequest<P = object, B = object>
  extends Request<P, object, B> {
  user: {
    id: string;
  };
}
