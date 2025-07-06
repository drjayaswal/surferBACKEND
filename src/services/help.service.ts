import db from "../config/db";
import { create_unique_id } from "../utils";
import { help_model } from "../models/help.model";

export const save_help = async (
  email: string,
  message: string
) => {
  try {
    const help_id = create_unique_id("HELP");
    const timestamp = new Date();
    const help = {
      id: help_id,
      message: message,
      email: email,
      created_at: timestamp,
    };

    await db.insert(help_model).values(help);
    return {
      success: true,
      code: 200,
      message: "help Send Successfully",
    };
  } catch (error) {
    console.log(
      `[ERROR] : Error in Sending Help  :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error in Sending Help",
    };
  }
};
