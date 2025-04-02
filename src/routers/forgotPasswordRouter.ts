import { TRPCError } from "@trpc/server";
import { procedure, router } from "../trpc.js";
import z from "zod";
import { combinedUserModel } from "../utils/roleMappings.js";

const InitiateForgotPasswordSchema = z.object({
  email: z.string().email(),
  role: z.enum(["student", "instructor"]),
});

export const forgotPasswordRouter = router({
  initiate: procedure
    .input(InitiateForgotPasswordSchema)
    .query(async ({ input }) => {
      try {
        const userModel = combinedUserModel(input.role);

        const userEmail = await userModel
          .findOne({ email: input.email })
          .select("email")
          .lean();

        if (!userEmail) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User was not found",
          });
        }

        
      } catch (err) {
        if (err instanceof TRPCError) throw err;
      }
    }),
});
