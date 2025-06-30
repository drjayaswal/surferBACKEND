import {
  boolean,
  integer,
  json,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { t } from "elysia";

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
  notes: json("notes").array().default([]),
  created_at: timestamp().defaultNow(),

  //---------------------------------------- yet to midgrate----------------------------------------
  password_updated_at: timestamp("password_updated_at", { withTimezone: true }),
  api_key: text(),
  api_key_generated_at: timestamp("api_key_generated_at", {
    withTimezone: true,
  }),
  TFA_enabled: boolean().default(false),
  DS_enabled: boolean().default(false),
  AT_enabled: boolean().default(false),
  activity_log: json("activity_log").array().default([]),
});

export { user_model };
