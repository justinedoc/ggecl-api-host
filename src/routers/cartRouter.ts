import NodeCache from "node-cache";
import z from "zod";
import StudentModel from "../models/studentModel.js";
import { protectedProcedure, router } from "../trpc.js";
import { ICart } from "../models/cartSchema.js";
import { TRPCError } from "@trpc/server";

const cache = new NodeCache({ stdTTL: 600 });

const getCartItems = (key: string): ICart[] | undefined => {
  return cache.get(`cartItems:${key}`);
};

const setCartItems = (key: string, items: ICart[]): void => {
  cache.set(`cartItems:${key}`, items);
};

export const cartRouter = router({
  
  getAllItems: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const cachedCartItems = getCartItems(userId);

    if (cachedCartItems) {
      return cachedCartItems;
    }

    try {
      const user = await StudentModel.findById(userId);

      if (!user) {
        throw new TRPCError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      const cartItems = user.cartItems;
      setCartItems(userId, cartItems);
      return cartItems;
    } catch (error) {
      console.error("Failed to retrieve cart items:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        message: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  
  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id: itemId }, ctx: { user } }) => {
      try {
        const updatedUser = await StudentModel.findOneAndUpdate(
          { _id: user.id },
          { $pull: { cartItems: { _id: itemId } } },
          { new: true }
        );

        if (!updatedUser) {
          throw new TRPCError({
            message: "User not found",
            code: "NOT_FOUND",
          });
        }

        cache.del(`cartItems:${user.id}`);
      } catch (error) {
        console.error("Error occurred while deleting cart item:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          message: "An unexpected error occurred",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
});
