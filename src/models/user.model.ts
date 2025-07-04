import {
  boolean,
  integer,
  json,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const user_model = pgTable("users", {
  id: text().primaryKey(),
  name: text(),
  email: text().unique(),
  hashed_password: text(),
  refresh_token: text(),
  avatar: text(),
  avatar_uploaded_at: timestamp({ withTimezone: true }),
  bio: text(),
  corpuses: jsonb().array().default([]),
  notes: json().array().default([]),
  created_at: timestamp().defaultNow(),
  password_updated_at: timestamp({ withTimezone: true }),
  api_key: text(),
  api_key_generated_at: timestamp({
    withTimezone: true,
  }),
  TFA_enabled: boolean().default(false),
  activity_logs: json().array().default([]),
});

export { user_model };
