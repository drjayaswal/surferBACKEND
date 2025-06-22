import { eq } from "drizzle-orm";
import db from "../config/db";
import {
  compare_password,
  generate_access_jwt,
  generate_refresh_jwt,
  hash_password,
  random_otp,
  verify_refresh_token,
} from "../utils";
import { user_model } from "../models/user.model";
import { otp_model } from "../models/otp.model";
import { JwtPayload } from "jsonwebtoken";

export const generate_otp = async (email: string) => {
  try {
    const user_query_response = await find_user(email);
    if (user_query_response.success) {
      return user_query_response;
    }
    const otp_query_response = await find_otp(email);
    if (!otp_query_response.success) {
      return otp_query_response;
    }
    const otp = random_otp();
    if (otp_query_response.success) {
      await db.update(otp_model).set({ otp });
    } else {
      await db.insert(otp_model).values({
        otp: otp,
        email: email,
      });
    }
    console.log(
      `[SERVER]  :  OTP Send to ${email} :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "OTP Generated Successfully",
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR : generate_otp",
    };
  }
};
export const verify_otp = async (otp: number, email: string) => {
  try {
    const otp_exists = (
      await db
        .delete(otp_model)
        .where(eq(otp_model.email, email) && eq(otp_model.otp, otp))
        .returning({ deletedOtp: otp_model.otp })
    )[0];

    if (!otp_exists) {
      console.log(`[SERVER]  :  No Such OTP :  ${new Date().toLocaleString()}`);
      return { success: false, code: 404, message: "No Such OTP" };
    }
    console.log(
      `[SERVER]  :  OTP Verified & Deleted :  ${new Date().toLocaleString()}`
    );
    return { success: true, code: 200, message: "OTP Verified & Deleted" };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : verify_otp" };
  }
};
export const create_user = async (
  name: string,
  email: string,
  password: string,
  id: string
) => {
  try {
    const hashed_password = await hash_password(password);
    const refresh_token = generate_refresh_jwt(email, name);
    const access_token = generate_access_jwt(email, name);
    const user = (
      await db
        .insert(user_model)
        .values({
          id,
          name,
          email,
          hashed_password,
          refresh_token,
        })
        .returning()
    )[0];
    console.log(
      `[SERVER]  :  User Created Successfully  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        id,
        name,
        email,
        access_token,
        refresh_token,
      },
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : create_user" };
  }
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
        `[SERVER]  :  No Such Refresh Token  :  ${new Date().toLocaleString()}`
      );
      return { success: false, code: 404, message: "Invalid Refresh Token" };
    }
    const { valid, payload } = verify_refresh_token(refresh_token);
    if (!valid) {
      console.log(
        `[SERVER]  :  Invalid Refresh Token  :  ${new Date().toLocaleString()}`
      );
      return { success: false, code: 404, message: "Invalid Refresh Token" };
    }
    if (!payload) {
      console.log(
        `[SERVER]  :  Invalid Payload  :  ${new Date().toLocaleString()}`
      );
      return { success: false, code: 404, message: "Invalid Payload" };
    }
    return {
      success: true,
      code: 200,
      message: "Refresh Token Valid",
      data: {
        email: payload.email,
        name: payload.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR : verify_refresh_token",
    };
  }
};
export const create_tokens = (email: string, name: string) => {
  const new_refresh_token = generate_refresh_jwt(email, name);
  const new_access_token = generate_access_jwt(email, name);
  return { new_refresh_token, new_access_token };
};
export const handle_login_by_token = async (payload: JwtPayload) => {
  try {
    const { email, name } = payload;

    const access_token = generate_access_jwt(email, name);
    const refresh_token = generate_refresh_jwt(email, name);

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
      console.log(
        `[SERVER]  :  User Not Found  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }
    console.log(
      `[SERVER]  :  User Logged in Successfully ( TOKEN )  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Logged in via refresh token",
      data: {
        id: updated_user.id,
        email: updated_user.email,
        name: updated_user.name,
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER]  :  Error logging in with token: ${
        error.message
      } :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error logging in with token",
      error: error?.message,
    };
  }
};
export const find_user = async (email: string) => {
  try {
    const user_exists = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];
    if (!user_exists) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: user_exists,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error : find_user",
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
      console.log(
        `[SERVER]  :  User Not Found  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    const is_otp_verified = await verify_otp(otp, email);
    if (!is_otp_verified.success) {
      console.log(`[SERVER]  :  Wrong OTP  :  ${new Date().toLocaleString()}`);
      return {
        success: is_otp_verified.success,
        code: is_otp_verified.code,
        message: is_otp_verified.message,
      };
    }

    const access_token = generate_access_jwt(email, user.name!);
    const refresh_token = generate_refresh_jwt(email, user.name!);

    await db
      .update(user_model)
      .set({ refresh_token })
      .where(eq(user_model.email, email));
    console.log(
      `[SERVER]  :  User Logged in Successfully ( OTP )  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        refresh_token: refresh_token,
        access_token: access_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER]  :  Error during login: ${
        error.message
      } :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Internal server error during login",
    };
  }
};
export const handle_login = async (password: string, email: string) => {
  try {
    const user = await db
      .select()
      .from(user_model)
      .where(eq(user_model.email, email))
      .then((res) => res[0]);

    if (!user) {
      console.log(
        `[SERVER]  :  User Not Found  :  ${new Date().toLocaleString()}`
      );
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
        help: {
          message: "Login via OTP!",
          link: `${process.env.FRONTEND_URL}/forgot-password`,
        },
      };
    }

    const isPasswordCorrect = await compare_password(
      password,
      user.hashed_password
    );
    if (!isPasswordCorrect) {
      console.log(
        `[SERVER]  :  Incorrect Password for ${email} :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 401,
        message: "Incorrect password",
      };
    }

    const access_token = generate_access_jwt(email, user.name!);
    const refresh_token = generate_refresh_jwt(email, user.name!);

    await db
      .update(user_model)
      .set({ refresh_token })
      .where(eq(user_model.email, email));
    console.log(
      `[SERVER]  :  User Logged in Successfully ( PASSWORD )  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        refresh_token: refresh_token,
        access_token: access_token,
      },
    };
  } catch (error: any) {
    console.error(
      `[SERVER]  :  Error during login: ${
        error.message
      } :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Internal server error during login",
    };
  }
};
export const find_otp = async (email: string) => {
  try {
    const otp_exists = (
      await db
        .select()
        .from(otp_model)
        .where(eq(otp_model.email, email))
        .limit(1)
    )[0];
    if (!otp_exists) {
      return { success: false, code: 404, message: "No Such OTP" };
    }
    return {
      success: true,
      code: 200,
      message: "OTP Exists",
      data: otp_exists,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error : find_otp",
    };
  }
};
