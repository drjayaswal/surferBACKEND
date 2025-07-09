import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// via connection params
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || "surfer",
    password: process.env.DB_PASSWORD || "surfer",
    database: process.env.DB_NAME || "surfer_db",
    ssl: true, // important for deployment
  },
  schema: ["./src/models/*"],
  out: "./drizzle",
});
