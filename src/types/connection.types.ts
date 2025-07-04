import { t } from "elysia";

export const SendPromptBody = t.Object({
  prompt: t.Optional(t.String()),
  attachments: t.Optional(t.Array(t.File())),
});
