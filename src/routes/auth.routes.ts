import Elysia from "elysia";
import {
  GenerateOtpSchema,
  LoginSchema,
  VerifyLoginOtpSchema,
  VerifySignupOtpSchema,
} from "../types/auth.types";
import {
  create_tokens,
  handle_login,
  handle_login_by_otp,
  handle_login_by_token,
  validate_refresh_token,
} from "../services/auth.service";
import { create_unique_id, verify_access_token } from "../utils";
import { generate_otp, verify_otp } from "../services/otp.service";
import { create_user } from "../services/user.service";

const auth_routes = new Elysia({ prefix: "/auth" })

  // SIGNUP
  .post(
    "/generate-otp",
    async ({ body, set }) => {
      const { email } = body;

      if (!email) {
        set.status = 404;
        console.log(
          `[SERVER]  :  Email Missing  :  ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Email Missing",
        };
      }

      const otp_response = await generate_otp(email);
      set.status = otp_response.code;
      return otp_response;
    },
    { body: GenerateOtpSchema }
  )
  .post(
    "/verify-signup-otp",
    async ({ body, set, cookie }) => {
      const { email, name, password, otp } = body;

      if (!email) {
        set.status = 404;
        console.log(
          `[SERVER]  :  Email Missing  :  ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Email Missing",
        };
      }

      const verify_query_response = await verify_otp(otp, email);
      if (!verify_query_response.success) {
        set.status = verify_query_response.code;
        console.log(
          `[SERVER]  :  Wrong OTP  :  ${new Date().toLocaleString()}`
        );
        return verify_query_response;
      }
      const user_id = create_unique_id("USER");
      const create_user_query_response = await create_user(
        user_id,
        name,
        email,
        password
      );
      if (!create_user_query_response.success) {
        set.status = create_user_query_response.code;
        return create_user_query_response;
      }
      if (create_user_query_response.data) {
        cookie["refresh_token"].set({
          value: create_user_query_response.data.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        cookie["access_token"].set({
          value: create_user_query_response.data.access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        console.log(
          `[SERVER]  :  Signup Tokens Send  :  ${new Date().toLocaleString()}`
        );
      }
      set.status = create_user_query_response.code;
      return create_user_query_response;
    },
    { body: VerifySignupOtpSchema }
  )

  // REFRESH TOKENS
  .get("/refresh-tokens", async ({ cookie, set }) => {
    const refresh_token = String(cookie.refresh_token);
    if (!refresh_token) {
      console.log(
        `[SERVER]  :  No Refresh Token Found  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "No Refresh Token",
      };
    }
    if (refresh_token.length < 10) {
      console.log(
        `[SERVER]  :  Not a Refresh Token  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 404,
        message: "Not a Refresh Token",
      };
    }
    const validate_refresh_token_response = await validate_refresh_token(
      refresh_token
    );

    if (!validate_refresh_token_response.success) {
      set.status = validate_refresh_token_response.code;
      return validate_refresh_token_response;
    }
    if (
      !validate_refresh_token_response.data ||
      !validate_refresh_token_response.data.email ||
      !validate_refresh_token_response.data.id
    ) {
      set.status = 500;
      console.log(
        `[SERVER]  :  Invalid Refresh Token Data  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 500,
        message: "Invalid refresh token data",
      };
    }

    const { email, id } = validate_refresh_token_response.data;
    const tokens = create_tokens(email, id);

    if (!tokens || !tokens.new_access_token || !tokens.new_refresh_token) {
      set.status = 500;
      console.log(
        `[SERVER]  :  Token Creation Failed  :  ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        code: 500,
        message: "Token creation failed",
      };
    }

    cookie["refresh_token"].set({
      value: tokens.new_refresh_token,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookie["access_token"].set({
      value: tokens.new_access_token,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    set.status = 200;
    console.log(
      `[SERVER]  :  Set Auto-Generated Tokens to Cookies  :  ${new Date().toLocaleString()}`
    );
    console.log(
      `[SERVER]  :  Tokens Created Successfully  :  ${new Date().toLocaleString()}`
    );
    return {
      success: true,
      code: 200,
      message: "Tokens Created Successfully",
      data: {
        access_token: tokens.new_access_token,
        refresh_token: tokens.new_refresh_token,
      },
    };
  })

  // LOGIN
  .post(
    "/login",
    async ({ body, set, cookie }) => {
      const existing_token = cookie["access_token"]?.value;

      if (existing_token) {
        const { valid, payload } = verify_access_token(existing_token);
        if (
          valid &&
          payload &&
          typeof payload === "object" &&
          "email" in payload
        ) {
          const login_response = await handle_login_by_token(payload);
          if (login_response.success) {
            console.log(
              `[SERVER]   Already Logged In : ${new Date().toLocaleString()}`
            );
            set.status = login_response.code;
            cookie["refresh_token"].set({
              value: login_response.data?.refresh_token,
              httpOnly: true,
              secure: true,
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            });
            cookie["access_token"].set({
              value: login_response.data?.access_token,
              httpOnly: true,
              secure: true,
              maxAge: 60 * 60 * 24,
              path: "/",
            });
            console.log(
              `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
            );
            return login_response;
          }
        }
      }
      const { email, password } = body;
      if (!email || !password) {
        set.status = 404;
        console.log(
          `[SERVER]   Email or Password Missing : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Email or Password Missing",
        };
      }
      const response = await handle_login(email, password);
      if (
        response.success &&
        response.data?.refresh_token &&
        response.data?.access_token
      ) {
        cookie["refresh_token"].set({
          value: response.data.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        cookie["access_token"].set({
          value: response.data.access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        console.log(
          `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
        );
      }
      console.log(`[SERVER]   Update Tokens : ${new Date().toLocaleString()}`);
      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )
  .post(
    "/verify-login-otp",
    async ({ body, set, cookie }) => {
      const { email, otp } = body;

      if (!email) {
        set.status = 404;
        console.log(
          `[SERVER]  :  Email Missing  :  ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Email Missing",
        };
      }

      const response = await handle_login_by_otp(otp, email);
      set.status = response.code;
      if (!response.success) {
        return response;
      }
      cookie["refresh_token"].set({
        value: response.data?.refresh_token,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      cookie["access_token"].set({
        value: response.data?.access_token,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      console.log(
        `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
      );
      console.log(`[SERVER]   Update Tokens : ${new Date().toLocaleString()}`);

      return response;
    },
    { body: VerifyLoginOtpSchema }
  )

  // LOGOUT
  .get("/logout", async ({ cookie, set }) => {
    const existing_token = cookie["refresh_token"].value;
    const access_token = cookie["access_token"].value;
    if (!existing_token && !access_token) {
      set.status = 404;
      console.log(
        `[SERVER]   Already Logged Out : ${new Date().toLocaleString()}`
      );
      return {
        success: false,
        message: "Already Logged Out",
      };
    }
    cookie["refresh_token"].remove();
    cookie["access_token"].remove();
    set.status = 200;
    console.log(`[SERVER]   Logged Out : ${new Date().toLocaleString()}`);
    return {
      success: true,
      message: "Logged Out Successfully",
    };
  });

export default auth_routes;
