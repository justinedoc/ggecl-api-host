import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js"; // Fixed typo in "procedure"
import z from "zod";
import { combinedUserModel } from "../utils/roleMappings.js";
import { parseJwt } from "../utils/jwt.js";

// Schema validation
const NotificationSchema = z.object({
  id: z.string().uuid(),
});


// main notifications router
export const notificationRouter = router({
  getAll: protectedProcedure
    .input(NotificationSchema)
    .query(async ({ input, ctx }) => {
      const { user, req } = ctx;
      const { id } = input;

      // Authorization check
      if (user.id !== id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID mismatch",
        });
      }

      try {
        // Token validation
        const refreshToken = req.cookies.session;
        if (!refreshToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Missing session token",
          });
        }

        // JWT parsing with error handling
        const payload = parseJwt(refreshToken);
        if (!payload?.role) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid token structure",
          });
        }

        // Database operation
        const UserModel = combinedUserModel(payload.role);
        const userRecord = await UserModel.findById(id)
          .select("notifications")
          .lean();

        if (!userRecord) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return userRecord.notifications ?? [];
      } catch (error) {
        console.error("Notification fetch error:", error);

        // Handle specific error types
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
        });
      }
    }),
});
