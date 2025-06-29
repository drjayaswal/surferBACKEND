import { eq } from "drizzle-orm";
import db from "../config/db";
import {
  random_otp,
} from "../utils";
import { otp_model } from "../models/otp.model";

export const generate_otp = async (email: string) => {
  try {
    const otp_query_response = await find_otp(email);
    const otp = random_otp();
    if (otp_query_response.success) {
      await db.update(otp_model).set({ otp }).where(eq(otp_model.email, email));
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
    console.error(
      `[SERVER]  :  Error generating OTP: ${error} :  ${new Date().toLocaleString()}`
    );
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
