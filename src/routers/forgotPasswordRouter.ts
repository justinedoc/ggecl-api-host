import { TRPCError } from "@trpc/server";
import { procedure, router } from "../trpc.js";
import z from "zod";
import { combinedUserModel } from "../utils/roleMappings.js";
import { passwordServices } from "../services/passwordServices.js";
import bycrpt from "bcrypt";
import { SALT_ROUNDS } from "../constants/auth.js";

const InitiateForgotPasswordSchema = z.object({
  email: z.string().email(),
  role: z.enum(["student", "instructor"]),
});

const updatePasswordSchema = z.object({
  token: z.string(),
  role: z.enum(["student", "instructor"]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const forgotPasswordRouter = router({
  initiate: procedure
    .input(InitiateForgotPasswordSchema)
    .query(async ({ input }) => {
      try {
        const userModel = combinedUserModel(input.role);
        const { initForgotPassword } = passwordServices(input.role);

        const user = await userModel.findOne({ email: input.email }).lean();

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User was not found",
          });
        }

        await initForgotPassword(user._id.toString());
      } catch (err) {
        console.error("Error initiating forgot password: ", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to initiate forgot password",
        });
      }
    }),

  updatePassword: procedure
    .input(updatePasswordSchema)
    .mutation(async ({ input }) => {
      const { token, password, role } = input;
      const { updatePassword } = passwordServices(role);

      const hashedPassword = await bycrpt.hash(password, SALT_ROUNDS);
      try {
        const result = await updatePassword(token, hashedPassword);

        if (!result.success) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: result.message,
          });
        }

        return result;
      } catch (err) {
        console.error(
          `Password update error: ${
            err instanceof Error ? err.message : "unknown"
          }`
        );
        if (err instanceof TRPCError) throw err;
      }
    }),
});
