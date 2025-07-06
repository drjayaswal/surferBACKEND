import { eq } from "drizzle-orm";
import db from "../config/db";
import { random_otp } from "../utils";
import { otp_model } from "../models/otp.model";
import { sendEmail } from "../lib/mailer";

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
    console.log(`[SERVER]  :  OTP Saved :  ${new Date().toLocaleString()}`);
    const htmlContent = `
    <div style="font-family: sans-serif; padding: 24px; color: #0f172a;">
      <h2 style="font-size: 20px; color: #0ea5e9; margin-bottom: 12px;">
        Your Verification Code
      </h2>
      <p style="font-size: 15px; margin: 12px 0;">
        Use the code below to verify your email:
      </p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
        ${otp}
      </p>
      <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
        Need help? Contact our team at <a href="mailto:support@surferai.com" style="color: #0ea5e9; text-decoration: none;">support@surferai.com</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; text-align: center;">
        &copy; ${new Date().getFullYear()} Surfer AI. All rights reserved.
      </p>
    </div>
  `;

    await sendEmail(email, "Surfer Verification Code", htmlContent);

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
