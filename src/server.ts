import { Elysia } from "elysia";
import "dotenv/config";
import auth_routes from "./routes/auth.routes";
import user_routes from "./routes/user.routes";
import cors from "@elysiajs/cors";
import upload_routes from "./routes/upload.routes";
import { connection_routes } from "./routes/connection.routes";
import { public_routes } from "./routes/public.routes";

const BACKEND = process.env.BACKEND_URL;
const FRONTEND = process.env.FRONTEND_URL;
const PORT = process.env.BACKEND_PORT;

if (!BACKEND || !FRONTEND || !PORT) {
  console.log(`[SERVER]  :  ENV missing  :  ${new Date().toLocaleString()}`);
  throw new Error("[SYSTEM]    ENV missing");
}

const app = new Elysia({ prefix: "/api" })
  .all("/", "Welcome to Surfer API..!")
  .use(
    cors({
      origin: FRONTEND,
      credentials: true,
    })
  )
  .use(auth_routes)
  .use(public_routes)
  .use(user_routes)
  .use(upload_routes)
  .use(connection_routes)
  .listen(PORT);

console.log(`[SERVER]  :  Server Connected  :  ${new Date().toLocaleString()}`);
