import Elysia, { t } from "elysia";
import { save_connect } from "../services/connect.service";
import { save_help } from "../services/help.service";
import { ConnectBody, HelpBody } from "../types/user.types";
import { sendEmail } from "../lib/mailer";

export const public_routes = new Elysia({ prefix: "/public" })
  .post(
    "/help",
    async ({ set, body }) => {
      const help = await save_help(body.email, body.message);
      set.status = help.code;
      return {
        code: help.code,
        success: help.success,
        message: help.message,
      };
    },
    { body: HelpBody }
  )
  .post(
    "/connect",
    async ({ set, body }) => {
      const connect = await save_connect(body.email, body.message);
      set.status = connect.code;
      return {
        code: connect.code,
        success: connect.success,
        message: connect.message,
      };
    },
    { body: ConnectBody }
  );
