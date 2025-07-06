import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: "Surfer - Surf Your AI Wave",
    to,
    subject,
    html,
  });

  console.log(`[SERVER]  :  OTP Send :  ${new Date().toLocaleString()}`);

  return info;
}
