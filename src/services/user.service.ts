import { eq, sql } from "drizzle-orm";
import db from "../config/db";
import {
  create_unique_id,
  createActivityLogEntry,
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
    const newActivity = createActivityLogEntry("Account Created");
    await db
      .insert(user_model)
      .values({
        id: id,
        name: name,
        email: email,
        hashed_password: hashed_password,
        password_updated_at: new Date(),
        refresh_token: refresh_token,
        activity_logs: [newActivity],
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
        activity_logs: newActivity,
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
    const newActivity = createActivityLogEntry("Avatar Updated");
    const update_response = (
      await db
        .update(user_model)
        .set({
          avatar: url,
          avatar_uploaded_at: new Date(),
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "Avatar Updated",
      data: { newActivity },
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
  corpusesFiles: {
    id: string;
    name: string;
    url: string;
    size: number;
    mime: string;
    created_at: Date;
  }[]
) => {
  try {
    const newActivity = createActivityLogEntry("Uploaded corpuses");
    const update_response = (
      await db
        .update(user_model)
        .set({
          corpuses: sql`array_cat(corpuses, ARRAY[${sql.join(
            corpusesFiles.map((file) => sql`${JSON.stringify(file)}::jsonb`),
            sql`, `
          )}])`,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "corpuses added successfully",
      data: { newActivity },
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
export const upload_note_to_database = async (id: string, content: string) => {
  try {
    const note_id = create_unique_id("NOTE");

    const newNote = {
      note_id,
      content: content,
      created_at: new Date(),
    };
    const newActivity = createActivityLogEntry("Note Added");
    const update_response = (
      await db
        .update(user_model)
        .set({
          notes: sql`array_append(notes,${JSON.stringify(newNote)}::json)`,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "Note added successfully",
      data: { newNote, newActivity },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: upload_note_to_database",
    };
  }
};
export const update_password_to_database = async (
  id: string,
  new_password: string
) => {
  try {
    const hashed_password = await hash_password(new_password);
    const timestamp = new Date();
    const newActivity = createActivityLogEntry("Password Updated");
    const update_response = (
      await db
        .update(user_model)
        .set({
          hashed_password: hashed_password,
          password_updated_at: timestamp,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "Password Updated successfully",
      data: { timestamp, newActivity },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: update_password_to_database",
    };
  }
};
export const update_apikey_to_database = async (id: string, key: string) => {
  try {
    const timestamp = new Date();
    const newActivity = createActivityLogEntry("API Key Updated");
    const update_response = (
      await db
        .update(user_model)
        .set({
          api_key: key,
          api_key_generated_at: timestamp,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "Api Key Stored",
      data: {
        newActivity,
        timestamp,
      },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: update_key_to_database",
    };
  }
};
export const update_profile_to_database = async (
  id: string,
  name?: string,
  bio?: string
) => {
  try {
    const newActivity = createActivityLogEntry("Profile Updated");
    const update_response = (
      await db
        .update(user_model)
        .set({
          name: name,
          bio: bio,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "Profile Updated",
      data: {
        newActivity,
      },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: update_profile_to_database",
    };
  }
};
export const update_tfa_to_database = async (id: string) => {
  try {
    const newActivity = createActivityLogEntry("TFA Updated");
    const update_response = (
      await db
        .update(user_model)
        .set({
          TFA_enabled: sql`NOT "TFA_enabled"`,
          activity_logs: sql`array_append(activity_logs, ${JSON.stringify(
            newActivity
          )}::json)`,
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
      message: "TFA Updated",
      data: {
        newActivity,
      },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      code: 500,
      message: "Error: update_tfa_to_database",
    };
  }
};
