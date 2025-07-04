import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../middleware";
import {
  find_user,
  update_apikey_to_database,
  update_password_to_database,
  update_profile_to_database,
  update_tfa_to_database,
} from "../services/user.service";
import {
  UpdateKeyBody,
  UpdatePasswordBody,
  UpdateProfileBody,
} from "../types/user.types";
import { compare_password } from "../utils";
import { find_connections } from "../services/connection.service";

const user_routes = new Elysia({ prefix: "/user" })
  .state({ email: "", id: "" })
  .guard(
    {
      beforeHandle({ cookie, set, store, headers }) {
        let access_token =
          String(cookie.access_token) ||
          String(headers["authorization"]?.replace("Bearer ", "") ?? "");
        if (!access_token) {
          set.status = 404;
          return {
            code: 404,
            success: false,
            message: "No Such User",
          };
        }
        const middleware_response = authenticate_jwt(access_token);
        set.status = middleware_response.code;
        if (!middleware_response.success) return middleware_response;
        if (!middleware_response.data?.email && !middleware_response.data?.id) {
          set.status = 404;
          return {
            code: 404,
            success: false,
            message: "Invalid Refresh Token",
          };
        }

        store.email = middleware_response.data.email;
        store.id = middleware_response.data.id;
      },
    },
    (app) =>
      app
        .get("/data", async ({ set, store, query }) => {
          const { credentials } = query;
          const user = await find_user(store.email);
          if (
            !user ||
            !user.data ||
            !("id" in user.data && "refresh_token" in user.data)
          ) {
            set.status = 404;
            return {
              code: 404,
              success: false,
              message: "No Such User",
            };
          }
          console.log("User Hydration");
          return {
            success: true,
            code: 200,
            data:
              credentials == "true"
                ? {
                    id: user.data.id,
                    name: user.data.name,
                    bio: user.data.bio,
                    password_updated_at: user.data.password_updated_at,
                    email: user.data.email,
                    avatar: user.data.avatar,
                    refresh_token: user.data.refresh_token,
                    corpuses: user.data.corpuses,
                    notes: user.data.notes,
                    created_at: user.data.created_at,
                    api_key_generated_at: user.data.api_key_generated_at,
                    TFA_enabled: user.data.TFA_enabled,
                    activity_logs: user.data.activity_logs,
                  }
                : {
                    id: user.data.id,
                    refresh_token: user.data.refresh_token,
                  },
          };
        })
        .post(
          "/update-password",
          async ({ set, store, body }) => {
            const { old_password, new_password, confirm_new_password } = body;
            if (new_password !== confirm_new_password) {
              return {
                code: 409,
                success: false,
                message: "New Password and Confirm New Password Mismatch",
              };
            }
            const user = await find_user(store.email);
            if (
              !user ||
              !user.data ||
              !("id" in user.data && "refresh_token" in user.data)
            ) {
              set.status = 404;
              return {
                code: 404,
                success: false,
                message: "No Such User",
              };
            }
            const is_valid = await compare_password(
              old_password,
              user.data.hashed_password!
            );
            if (!is_valid) {
              return {
                code: 409,
                success: false,
                message: "Password Mismatch",
              };
            }
            const response = await update_password_to_database(
              store.id,
              new_password
            );
            set.status = response.code;
            return response;
          },
          { body: UpdatePasswordBody }
        )
        .post(
          "/update-apikey",
          async ({ set, store, body }) => {
            const { key } = body;
            const user = await find_user(store.email);
            if (
              !user ||
              !user.data ||
              !("id" in user.data && "refresh_token" in user.data)
            ) {
              set.status = 404;
              return {
                code: 404,
                success: false,
                message: "No Such User",
              };
            }
            const response = await update_apikey_to_database(store.id, key);
            set.status = response.code;
            return response;
          },
          { body: UpdateKeyBody }
        )
        .post(
          "/update-profile",
          async ({ set, store, body }) => {
            const { name, bio } = body;
            if (!name && !bio) {
              set.status = 400;
              return {
                code: 400,
                success: false,
                message: "Empty Body",
              };
            }
            const user = await find_user(store.email);
            if (
              !user ||
              !user.data ||
              !("id" in user.data && "refresh_token" in user.data)
            ) {
              set.status = 404;
              return {
                code: 404,
                success: false,
                message: "No Such User",
              };
            }
            const response = await update_profile_to_database(
              store.id,
              name,
              bio
            );
            set.status = response.code;
            return response;
          },
          { body: UpdateProfileBody }
        )
        .get("/update-tfa", async ({ set, store }) => {
          const user = await find_user(store.email);
          if (
            !user ||
            !user.data ||
            !("id" in user.data && "refresh_token" in user.data)
          ) {
            set.status = 404;
            return {
              code: 404,
              success: false,
              message: "No Such User",
            };
          }
          const response = await update_tfa_to_database(store.id);
          set.status = response.code;
          return response;
        })
        .get("/connections", async ({ set, store }) => {
          const user = await find_user(store.email);
          if (
            !user ||
            !user.data ||
            !("id" in user.data && "refresh_token" in user.data)
          ) {
            set.status = 404;
            return {
              code: 404,
              success: false,
              message: "No Such User",
            };
          }
          const connections = await find_connections(store.id);
          set.status = connections.code;
          if (!user.data) {
            return {
              code: connections.code,
              success: connections.success,
              message: connections.message,
            };
          }
          console.log("Connection Hydration");
          return {
            code: connections.code,
            success: connections.success,
            message: connections.message,
            data: connections.data,
          };
        })
  );

export default user_routes;
