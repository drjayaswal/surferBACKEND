import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../middleware";
import { SendPromptBody } from "../types/connection.types";
import { save_connection } from "../services/connection.service";
import { upload_to_s3 } from "../services/s3.service";

export const connection_routes = new Elysia({ prefix: "/connection" })
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
      app.post(
        "/send",
        async ({ store, set, body }) => {
          const { prompt, attachments } = body;

          let uploaded: { url: string }[] = [];
          if (attachments && attachments.length) {
            const files = await Promise.all(
              attachments.map(async (file) => ({
                buffer: Buffer.from(await file.arrayBuffer()),
                name: file.name,
                type: file.type,
              }))
            );

            const upload_result = await upload_to_s3(files, store.id);
            if (!upload_result.success) {
              set.status = 500;
              return {
                success: false,
                code: 500,
                message: "Attachment upload failed",
              };
            }

            uploaded = upload_result.data;
          }

          const answer = "Hiklsabdlkshbfjlaknfbla fkwfbdalkjfnakls asdjfnalksjdf";

          const response = await save_connection(
            store.id,
            answer,
            prompt,
            uploaded
          );
          if (!response.success) {
            set.status = response.code;
            return response;
          }

          set.status = 200;
          return {
            success: true,
            code: 200,
            message: "Connection Completed",
            data: response.data,
          };
        },
        {
          body: SendPromptBody,
        }
      )
  );
