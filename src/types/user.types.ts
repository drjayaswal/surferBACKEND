import { t } from "elysia";

export const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String(),
  password: t.String(),
  created_at: t.Date(),
});
export const UpdatePasswordBody = t.Object({
  old_password: t.String(),
  new_password: t.String(),
  confirm_new_password: t.String(),
});

export type UserType = (typeof UserSchema)["static"];
