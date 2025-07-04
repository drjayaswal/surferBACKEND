import { text, timestamp, pgTable, json } from "drizzle-orm/pg-core";
import { user_model } from "./user.model";

const connection_model = pgTable("connections", {
  id: text().primaryKey(),

  user_id: text()
    .notNull()
    .references(() => user_model.id, { onDelete: "cascade" }),

  prompt: json().default({}),
  answer: json().default({}),

  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

export { connection_model };
