import { eq, sql } from "drizzle-orm";
import db from "../config/db";
import {
  generate_access_jwt,
  generate_refresh_jwt,
  hash_password,
} from "../utils";
import { user_model } from "../models/user.model";

export const create_user = async (
  id: string,
  name: string,
  email: string,
  password: string
) => {
  try {
    const hashed_password = await hash_password(password);
    const refresh_token = generate_refresh_jwt(email, id);
    const access_token = generate_access_jwt(email, id);
    await db
      .insert(user_model)
      .values({
        id: id,
        name: name,
        email: email,
        hashed_password: hashed_password,
        refresh_token: refresh_token,
      })
      .returning();
    console.log(
      `[SERVER]  :  User Created Successfully  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        access_token: access_token,
        refresh_token: refresh_token,
      },
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : create_user" };
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
export const upload_to_database = async (id: string, url: string) => {
  try {
    const update_response = (
      await db
        .update(user_model)
        .set({ avatar: url, avatar_uploaded_at: new Date() })
        .where(eq(user_model.id, id))
        .returning()
    )[0];
    if (!update_response) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "Avatar Updated",
      url: url,
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: upload_to_database",
    };
  }
};
export const upload_corpuses_to_database = async (
  id: string,
  corpusFiles: {
    id: string;
    name: string;
    url: string;
    size: number;
    mime: string;
    created_at: Date;
  }[]
) => {
  try {
    const update_response = (
      await db
        .update(user_model)
        .set({
          corpuses: sql`array_cat(corpuses, ARRAY[${sql.join(
            corpusFiles.map((file) => sql`${JSON.stringify(file)}::jsonb`),
            sql`, `
          )}])`,
        })
        .where(eq(user_model.id, id))
        .returning()
    )[0];

    if (!update_response) {
      return { success: false, code: 404, message: "No Such User" };
    }

    return {
      success: true,
      code: 200,
      message: "Corpuses added successfully",
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: upload_corpuses_to_database",
    };
  }
};