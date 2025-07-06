import { t } from "elysia";

export const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String(),
  password: t.String(),
  created_at: t.Date(),
});
export const ConnectBody = t.Object({
  email: t.String(),
  message: t.String(),
});
export const HelpBody = t.Object({
  email: t.String(),
  message: t.String(),
});
export const UpdatePasswordBody = t.Object({
  old_password: t.String(),
  new_password: t.String(),
  confirm_new_password: t.String(),
});
export const UpdateKeyBody = t.Object({
  key: t.String(),
});
export const UpdateProfileBody = t.Object({
  name: t.Optional(t.String()),
  bio: t.Optional(t.String()),
});
export type UserType = (typeof UserSchema)["static"];
