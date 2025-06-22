import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcrypt";

export const random_otp = () => {
  return Math.floor(10000 + Math.random() * 90000);
};
export const create_unique_id = (type: string) => {
  return `${type.toUpperCase()}-${Date.now()}`;
};
export const hash_password = async (password: string): Promise<string> => {
  const SALT = 10;
  const hashed_password = await bcrypt.hash(password, SALT);
  return hashed_password;
};
export const generate_jwt = (email: string, name: string) => {
  return jwt.sign({ email, name }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "1m",
  });
};
export const verify_jwt = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_KEY || "heymama");
};
export const generate_refresh_jwt = (email: string, name: string) => {
  return jwt.sign({ email, name }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "7d",
  });
};
export const generate_access_jwt = (email: string, name: string) => {
  return jwt.sign({ email, name }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "1d",
  });
};
export const compare_password = async (
  password: string,
  hashed_password: string
) => {
  return await bcrypt.compare(password, hashed_password);
};
export const verify_refresh_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");
    const { email, name } = payload as { email: string; name: string };
    if (!email || !name) {
      return { valid: false };
    }
    if (typeof email !== "string" || typeof name !== "string") {
      return { valid: false };
    }
    return {
      valid: true,
      payload: {
        email,
        name,
      },
    };
  } catch (err) {
    return { valid: false };
  }
};
export const verify_access_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");
    const { email, name } = payload as { email: string; name: string };
    if (!email || !name) {
      return { valid: false };
    }
    if (typeof email !== "string" || typeof name !== "string") {
      return { valid: false };
    }
    return {
      valid: true,
      payload: {
        email,
        name,
      },
    };
  } catch (err) {
    return { valid: false };
  }
};
