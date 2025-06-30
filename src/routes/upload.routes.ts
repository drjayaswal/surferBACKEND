import { Elysia } from "elysia";
import { authenticate_jwt } from "../middlewares";
import {
  UploadAvatarBody,
  UploadCorpusBody,
  UploadNoteBody,
} from "../types/upload.types";
import {
  find_user,
  upload_corpuses_to_database,
  upload_note_to_database,
  upload_to_database,
} from "../services/user.service";
import { upload_to_s3, uploads_to_s3 } from "../services/s3.service";
import { checkDateOrTimeRemaining } from "../utils";

const upload_routes = new Elysia({ prefix: "/upload" })
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
            message: "No Access Token Found",
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
        .post(
          "/avatar",
          async ({ body, set, store }) => {
            const userExists = await find_user(store.email);
            if (!userExists.success) {
              set.status = userExists.code;
              return userExists;
            }

            const existingAvatar = userExists.data?.avatar;
            if (existingAvatar) {
              const check = checkDateOrTimeRemaining(
                userExists.data?.avatar_uploaded_at!
              );
              if (check !== true) {
                set.status = 201;
                return {
                  success: false,
                  code: 201,
                  message: check,
                };
              }
            }

            const buffer = await body.file.arrayBuffer();
            const result = await upload_to_s3(
              Buffer.from(buffer),
              body.file.type,
              store.id,
              "avatar",
              body.file.name
            );

            if (!result.success) {
              return {
                success: false,
                code: 500,
                message: "Failed to upload avatar",
              };
            }

            const save_avatar_response = await upload_to_database(
              store.id,
              result.url
            );
            if (!save_avatar_response.success) {
              set.status = save_avatar_response.code;
              return save_avatar_response;
            }
            return {
              success: result.success,
              code: 200,
              message: result.message,
            };
          },
          { body: UploadAvatarBody }
        )
        .post(
          "/corpuses",
          async ({ body, set, store }) => {
            const userExists = await find_user(store.email);
            if (!userExists.success) {
              set.status = userExists.code;
              return userExists;
            }

            const files = body.files;

            const buffers = await Promise.all(
              files.map(async (file) => ({
                buffer: Buffer.from(await file.arrayBuffer()),
                type: file.type,
                name: file.name,
                size: file.size,
              }))
            );

            const result = await uploads_to_s3(buffers, store.id);
            if (!result.success || !result.data) {
              return { success: false, code: 500, message: "Upload failed" };
            }

            const corpusFiles = result.data.map((file, i) => ({
              id: `COR-${Date.now()}-${i + 1}`,
              name: buffers[i].name,
              url: file.url,
              size: buffers[i].buffer.length,
              mime: buffers[i].type,
              created_at: new Date(),
            }));

            const save_result = await upload_corpuses_to_database(
              store.id,
              corpusFiles
            );

            if (!save_result.success) {
              set.status = save_result.code;
              return save_result;
            }

            return {
              success: true,
              code: 200,
              message: "Corpuses uploaded successfully",
              data: corpusFiles,
            };
          },
          { body: UploadCorpusBody }
        )
        .post(
          "/note",
          async ({ body, set, store }) => {
            const userExists = await find_user(store.email);
            if (!userExists.success) {
              set.status = userExists.code;
              return userExists;
            }

            const save_result = await upload_note_to_database(
              store.id,
              body.content
            );
            set.status = save_result.code;
            if (!save_result.success) {
              return {
                success: save_result.success,
                code: save_result.code,
                message: save_result.message,
              };
            }
            return {
              success: save_result.success,
              code: save_result.code,
              message: save_result.message,
              data: save_result.note,
            };
          },
          { body: UploadNoteBody }
        )
  );
export default upload_routes;
