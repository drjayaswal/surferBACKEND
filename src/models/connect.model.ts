import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const connect_model = pgTable("connects", {
  id: text().primaryKey(),
  email: text(),
  message: text(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});
