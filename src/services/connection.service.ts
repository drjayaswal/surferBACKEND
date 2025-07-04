import db from "../config/db";
import { create_unique_id } from "../utils";
import { connection_model } from "../models/connection.model";
import { eq } from "drizzle-orm";

export const save_connection = async (
  user_id: string,
  answer: string,
  prompt?: string,
  uploaded?: {}[]
) => {
  try {
    const connection_id = create_unique_id("CONNECTION");
    const timestamp = new Date();
    const connection = {
      id: connection_id,
      user_id: user_id,
      prompt: {
        sender: "user",
        content: prompt,
        attachments: uploaded,
      },
      answer: {
        sender: "ai",
        content: answer,
      },
      created_at: timestamp,
    };

    await db.insert(connection_model).values(connection);
    return {
      success: true,
      code: 200,
      message: "Connection Created Successfully",
      data: connection,
    };
  } catch (error) {
    console.log(
      `[ERROR] : Error in Creating Connection  :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error in Creating Connection",
    };
  }
};
export const find_connections = async (user_id: string) => {
  try {
    const connections = await db
      .select()
      .from(connection_model)
      .where(eq(connection_model.user_id, user_id));
    return {
      success: true,
      code: 200,
      message: `Total ${connections.length} Connections Found`,
      data: connections,
    };
  } catch (error) {
    console.log(
      `[ERROR] : Error in Finding Connections  :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error in Finding Connections",
    };
  }
};
