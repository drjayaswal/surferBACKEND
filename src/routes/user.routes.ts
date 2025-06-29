import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../middlewares";
import { find_user } from "../services/user.service";

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
      app.get("/data", async ({ set, store, query }) => {
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
        console.log("send user data");
        return {
          success: true,
          code: 200,
          data:
            credentials == "true"
              ? {
                  id: user.data.id,
                  name: user.data.name,
                  email: user.data.email,
                  avatar: user.data.avatar,
                  refresh_token: user.data.refresh_token,
                  corpuses: user.data.corpuses,
                  created_at: user.data.created_at,
                }
              : {
                  id: user.data.id,
                  refresh_token: user.data.refresh_token,
                },
        };
      })
  );

export default user_routes;
