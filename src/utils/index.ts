/**
 * Utility Functions for Auth, File Management, ID Generation, and Date Checks
 */

import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcrypt";
import { unlink, writeFile } from "fs/promises";

/**
 * Generates a 5-digit numeric OTP
 */
export const random_otp = (): number => {
  return Math.floor(10000 + Math.random() * 90000);
};

/**
 * Creates a unique ID with a given prefix and timestamp
 * @param type - A string like 'usr', 'doc', 'org', etc.
 * @returns A unique ID like "USR-1751200000000"
 */
export const create_unique_id = (type: string): string => {
  return `${type.toUpperCase()}-${Date.now()}`;
};

/**
 * Hashes a plain password
 * @param password - Raw password string
 * @returns A hashed password
 */
export const hash_password = async (password: string): Promise<string> => {
  const SALT = 10;
  return await bcrypt.hash(password, SALT);
};

/**
 * Compares raw password with hashed password
 * @param password - Plain password
 * @param hashed_password - Hashed version from DB
 */
export const compare_password = async (
  password: string,
  hashed_password: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashed_password);
};

/**
 * Generates a refresh JWT valid for 7 days
 */
export const generate_refresh_jwt = (email: string, id: string): string => {
  return jwt.sign({ email, id }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "7d",
  });
};

/**
 * Generates an access JWT valid for 1 day
 */
export const generate_access_jwt = (email: string, id: string): string => {
  return jwt.sign({ email, id }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "1d",
  });
};

/**
 * Verifies a JWT and returns the decoded payload
 */
export const verify_jwt = (token: string): string | jwt.JwtPayload => {
  return jwt.verify(token, process.env.ACCESS_KEY || "heymama");
};

/**
 * Verifies refresh token structure and validity
 */
export const verify_refresh_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");
    const { email, id } = payload as { email: string; id: string };
    if (!email || !id || typeof email !== "string" || typeof id !== "string") {
      return { valid: false };
    }
    return { valid: true, payload: { email, id } };
  } catch (err) {
    return { valid: false };
  }
};

/**
 * Verifies access token structure and validity
 */
export const verify_access_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");
    const { email, id } = payload as { email: string; id: string };
    if (!email || !id || typeof email !== "string" || typeof id !== "string") {
      return { valid: false };
    }
    return { valid: true, payload: { email, id } };
  } catch (err) {
    return { valid: false };
  }
};

/**
 * Saves a file to disk from a File object
 * @param path - Path to save the file (e.g., ./temp/user.png)
 * @param file - File object (from multipart)
 */
export const save_image = async (path: string, file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path, buffer);
};

/**
 * Deletes a file from the filesystem
 */
export const delete_image = async (path: string) => {
  return await unlink(path);
};

/**
 * Extracts the file extension (including the dot)
 * @param filename - e.g. "profile.png"
 * @returns e.g. ".png"
 */
export const getExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
};
/**
 * Checks if a given date is older than N days.
 * - Returns `true` if expired
 * - Else returns a string like "try after 2d 3h 45m"
 *
 * @param date - The Date object to check
 * @param days - Number of days threshold (default: 30)
 * @returns true | string
 */
export const checkDateOrTimeRemaining = (
  date: Date,
  days = 30
): true | string => {
  const now = Date.now();
  const givenTime = date.getTime();
  const threshold = days * 24 * 60 * 60 * 1000;

  const diff = now - givenTime;

  if (diff >= threshold) return true;

  const remainingMs = threshold - diff;
  const d = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((remainingMs / (1000 * 60)) % 60);

  return `Try After ${d}d ${h}h ${m}m`;
};