import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/user.model";
import {
  compare_password,
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
} from "../../utils";

//  1 DB Call
const find_user_by_email = async (email: string) => {
  try {
    const exisiting_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];
    if (!exisiting_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: exisiting_user,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error in finding user by email",
    };
  }
};
//  1 DB Call
const find_user_by_phone = async (email: string) => {
  try {
    const exisiting_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];
    if (!exisiting_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: exisiting_user,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error in finding user by phone",
    };
  }
};
//  1 DB Call
const handle_signup = async (name: string, password: string, email: string) => {
  try {
    const hashed_password = await hash_password(password);
    const access_token = generate_jwt(email, name);
    const refresh_token = generate_refresh_jwt(email, name);

    await db
      .insert(user_model)
      .values({
        name,
        email,
        hashed_password,
        refresh_token,
      })
      .returning();
    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        name,
        email,
        hashed_password,
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Email already exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Error in handling signup",
    };
  }
};
//  2 DB Call
const handle_login = async (password: string, email: string) => {
  try {
    const user = await db
      .select()
      .from(user_model)
      .where(eq(user_model.email, email!))
      .then((res) => res[0]);

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }
    const correct_password = await compare_password(
      password,
      user.hashed_password!
    );
    if (!correct_password) {
      return {
        success: false,
        code: 401,
        message: "Incorrect password",
      };
    }
    const access_token = generate_jwt(email, user.name!);
    const refresh_token = generate_refresh_jwt(email, user.name!);

    await db
      .update(user_model)
      .set({ refresh_token })
      .where(eq(user_model.email, email!));

    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        name: user.name,
        refresh_token: refresh_token,
        access_token: access_token,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.log("Login error:", error);
    return {
      success: false,
      code: 500,
      message: "Error in handling login",
    };
  }
};

export { find_user_by_email, find_user_by_phone, handle_signup, handle_login };
