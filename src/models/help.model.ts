import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const help_model = pgTable("helps", {
  id: text().primaryKey(),
  email: text(),
  message: text(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});
