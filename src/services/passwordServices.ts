import { forgotPasswordHtml } from "../constants/forgotPasswordEmail.js";
import {
  FORGOT_PASSWORD_EMAIL_TEXT,
  FORGOT_PASSWORD_SUBJECT,
} from "../constants/messages.js";
import { combinedUserModel, UserRole } from "../utils/roleMappings.js";
import { sendVerificationToEmail } from "./sendVerificationToEmail.js";
import {
  constructVerificationLink,
  generateVerificationToken,
} from "./verification.js";

export const passwordServices = (role: UserRole) => {
  const UserModel = combinedUserModel(role);

  async function initForgotPassword(userId: string) {
    try {
      const { token, expires } = generateVerificationToken();

      const user = await UserModel.findByIdAndUpdate(userId, {
        passwordUpdateToken: token,
        passwordUpdateTokenExpiry: expires,
      });

      if (!user) throw new Error("User not found");

      const verificationLink = constructVerificationLink(token);

      const result = await sendVerificationToEmail({
        username: user.fullName,
        toEmail: user.email,
        verificationLink,
        html: forgotPasswordHtml(user.fullName, verificationLink),
        message: FORGOT_PASSWORD_EMAIL_TEXT(verificationLink),
        subject: FORGOT_PASSWORD_SUBJECT,
      });

      return result;
    } catch (err) {
      throw new Error(
        `Failed to init forgot password: ${err instanceof Error && err.message}`
      );
    }
  }

  async function updatePassword(token: string, hashedPassword: string) {
    try {
      const user = await UserModel.findOne({
        passwordUpdateToken: token,
        passwordUpdateTokenExpiry: { $gt: new Date() },
        googleSignIn: false,
      });

      if (!user)
        return { success: false, message: "Failed to update password" };

      await UserModel.findByIdAndUpdate(user._id, {
        $unset: {
          passwordUpdateToken: 1,
          passwordUpdateTokenExpiry: 1,
        },
        $set: {
          password: hashedPassword,
        },
      });

      return { success: true, message: "Password updated successfully" };
    } catch (err) {
      console.error("Password update failed: ", err);
      return { success: false, message: "Failed to update password" };
    }
  }

  return { initForgotPassword, updatePassword };
};
