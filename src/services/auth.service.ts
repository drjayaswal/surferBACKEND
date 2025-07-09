import { eq, sql } from "drizzle-orm";
import db from "../config/db";
import {
  compare_password,
  createActivityLogEntry,
  generate_access_jwt,
  generate_refresh_jwt,
  verify_refresh_token,
} from "../utils";
import { user_model } from "../models/user.model";
import { JwtPayload } from "jsonwebtoken";
import { verify_otp } from "./otp.service";

export const create_tokens = (email: string, id: string) => {
  const new_refresh_token = generate_refresh_jwt(email, id);
  const new_access_token = generate_access_jwt(email, id);
  return { new_refresh_token, new_access_token };
};
export const validate_refresh_token = async (refresh_token: string) => {
  try {
    const user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.refresh_token, refresh_token))
        .limit(1)
    )[0];

    if (!user) {
      console.log(
        `[SERVER] No Such Refresh Token: ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "Invalid Refresh Token",
      };
    }

    const { valid, payload } = verify_refresh_token(refresh_token);

    if (!valid || !payload) {
      console.log(
        `[SERVER] Invalid Refresh Token or Payload: ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "Invalid Refresh Token",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Refresh Token Valid",
      data: {
        email: payload.email,
        id: payload.id,
      },
    };
  } catch (error) {
    console.error(
      `[SERVER] Error validating refresh token: ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "ERROR : verify_refresh_token",
    };
  }
};
export const handle_login_by_token = async (payload: JwtPayload) => {
  try {
    const { email, id } = payload;

    const access_token = generate_access_jwt(email, id);
    const refresh_token = generate_refresh_jwt(email, id);

    const updated_user = await db
      .update(user_model)
      .set({ refresh_token })
      .where(eq(user_model.email, email))
      .returning({
        id: user_model.id,
        name: user_model.name,
        email: user_model.email,
      })
      .then((rows) => rows[0]);

    if (!updated_user) {
      console.log(`[SERVER] User Not Found: ${new Date().toLocaleString()}`);
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    console.log(
      `[SERVER] User Logged in Successfully (TOKEN): ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Logged in via refresh token",
      data: {
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER] Error logging in with token: ${
        error.message
      } : ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error logging in with token",
      error: error?.message,
    };
  }
};
export const handle_login_by_otp = async (otp: number, email: string) => {
  try {
    const user = await db
      .select()
      .from(user_model)
      .where(eq(user_model.email, email))
      .then((res) => res[0]);

    if (!user) {
      console.log(`[SERVER] User Not Found: ${new Date().toLocaleString()}`);
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    const is_otp_verified = await verify_otp(otp, email);
    if (!is_otp_verified.success) {
      console.log(`[SERVER] Wrong OTP: ${new Date().toLocaleString()}`);
      return {
        success: false,
        code: is_otp_verified.code,
        message: is_otp_verified.message,
      };
    }

    const access_token = generate_access_jwt(email, user.id);
    const refresh_token = generate_refresh_jwt(email, user.id);
    const newActivity = createActivityLogEntry("Login Successful via OTP ");
    await db
      .update(user_model)
      .set({
        refresh_token,
        activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
          newActivity
        )}::json)`,
      })
      .where(eq(user_model.email, email));

    console.log(
      `[SERVER] User Logged in Successfully (OTP): ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER] Error during OTP login: ${
        error.message
      } : ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Internal server error during login",
    };
  }
};
export const handle_login = async (email: string, password: string) => {
  try {
    const user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];

    if (!user) {
      console.log(`[SERVER] User Not Found: ${new Date().toLocaleString()}`);
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    if (!user.hashed_password) {
      return {
        success: false,
        code: 403,
        message: "Account is not password protected",
      };
    }

    const isPasswordCorrect = await compare_password(
      password,
      user.hashed_password
    );
    if (!isPasswordCorrect) {
      console.log(
        `[SERVER] Incorrect Password for ${email}: ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 401,
        message: "Incorrect password",
      };
    }

    const access_token = generate_access_jwt(email, user.id);
    const refresh_token = generate_refresh_jwt(email, user.id);
    const newActivity = createActivityLogEntry(
      "Login Successful via Password "
    );
    await db
      .update(user_model)
      .set({
        refresh_token,
        activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
          newActivity
        )}::json)`,
      })
      .where(eq(user_model.email, email));

    console.log(
      `[SERVER] User Logged in Successfully (PASSWORD): ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER] Error during password login: ${
        error.message
      } : ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Internal server error during login",
    };
  }
};
