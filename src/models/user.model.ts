import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const user_model = pgTable("users", {
  id: text().primaryKey(),
  name: text(),
  email: text().unique(),
  hashed_password: text(),
  refresh_token: text(),
  avatar: text(),
  avatar_uploaded_at: timestamp("avatar_uploaded_at", { withTimezone: true }),
  bio: text(),
  corpuses: jsonb("corpuses").array().default([]),
  created_at: timestamp().defaultNow(),
});

export { user_model };
