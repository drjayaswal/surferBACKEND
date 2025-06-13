import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

const user_model = pgTable("users", {
  id: serial().primaryKey(),
  name: text(),
  email: text().unique(),
  hashed_password: text(),
  refresh_token: text(),
  profile_pic: text(),
  created_at: timestamp().defaultNow(),
});


export { user_model };
