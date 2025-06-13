import { Elysia, t } from "elysia";
import { handle_login, handle_signup } from "../services/shared/user.service";
import { generate_otp, verify_otp } from "../services/shared/otp.service";
import {
  LoginSchema,
  VerifyOtpSchema,
  GenerateOtpSchema,
  SignupSchema,
} from "../types/auth.types";
import { verify_refresh_token } from "../utils";

const auth_routes = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      const response = await handle_login(body.password, body.email);

      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )
  .post(
    "/generate-otp",
    async ({ body, set, cookie }) => {
      const existing_token = cookie["refresh_token"].value;

      if (existing_token) {
        const { valid, payload } = verify_refresh_token(existing_token);
        console.log(valid);
        console.log(payload);

        if (valid) {
          set.status = 400;
          return {
            success: false,
            message: "You're already logged in.",
            code: 400,
          };
        }
      }

      const otpResponse = await generate_otp(body.email);
      set.status = otpResponse.code;
      return otpResponse;
    },
    {
      body: GenerateOtpSchema,
    }
  )
  .post(
    "/verify-otp",
    async ({ body, set }) => {
      const otpResponse = await verify_otp(body.otp, body.email);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        return otpResponse;
      }
      set.status = otpResponse.code;
      return otpResponse;
    },
    { body: VerifyOtpSchema }
  )
  .post(
    "/signup",
    async ({ body, set, cookie }) => {
      const response = await handle_signup(
        body.name,
        body.password,
        body.email
      );

      if (response.success && response.data?.refresh_token) {
        cookie["refresh_token"].set({
          value: response.data.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }

      set.status = response.code;
      return response;
    },
    { body: SignupSchema }
  );
export default auth_routes;
