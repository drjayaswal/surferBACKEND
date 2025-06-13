import { t } from "elysia";

const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String(),
  password: t.String(),
  created_at: t.Date(),
});

type UserType = (typeof UserSchema)["static"];

export { UserSchema, UserType };
