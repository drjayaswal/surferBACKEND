import { integer, serial, pgTable, text } from "drizzle-orm/pg-core";

const otp_model = pgTable("otps", {
  id: serial().primaryKey(),
  email: text("email"),
  otp: integer("otp"),
});

export { otp_model };