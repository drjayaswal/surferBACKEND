import db from "../config/db";
import { create_unique_id } from "../utils";
import { connect_model } from "../models/connect.model";

export const save_connect = async (
  email: string,
  message: string
) => {
  try {
    const connect_id = create_unique_id("CONNECT");
    const timestamp = new Date();
    const connect = {
      id: connect_id,
      message: message,
      email: email,
      created_at: timestamp,
    };

    await db.insert(connect_model).values(connect);
    return {
      success: true,
      code: 200,
      message: "Connect Send Successfully",
    };
  } catch (error) {
    console.log(
      `[ERROR] : Error in Sending Connect  :  ${new Date().toLocaleString()}`
    );
    return {
      success: false,
      code: 500,
      message: "Error in Sending Connect",
    };
  }
};
