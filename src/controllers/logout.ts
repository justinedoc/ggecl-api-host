import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { combinedUserModel, UserRole } from "../utils/roleMappings.js";
import { parseJwt } from "../utils/jwt.js";
import { studentAuthService } from "../services/studentAuth.js";
import { instructorAuthService } from "../services/instructorAuth.js";
import { clearRefreshTokenCookie } from "../utils/cookieUtils.js";
import { createErrorResponse } from "../utils/responseUtils.js";

export const logout = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.session;
    if (!refreshToken) {
      res.sendStatus(204);
      return;
    }

    try {
      const { role } = parseJwt(refreshToken);
      console.log(`${role} is logging out`);
      const userModel = combinedUserModel(role);
      const user = await userModel.findOne({ refreshToken });
      if (user) {
        await clearRefreshTokenSwitch(role, user._id as string);
      }

      clearRefreshTokenCookie(res);
      res.sendStatus(200);
    } catch (error) {
      console.error("user logout error:", error);
      createErrorResponse(res, 500, "Internal server error");
    }
  }
);

async function clearRefreshTokenSwitch(role: UserRole, userId: string) {
  switch (role) {
    case "student":
      await studentAuthService.clearRefreshToken(userId);
      break;
    case "instructor":
      await instructorAuthService.clearRefreshToken(userId);
      break;
    default:
      console.error("Invalid role");
      break;
  }
}
