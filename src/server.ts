import { Elysia } from "elysia";
import "dotenv/config";
import auth_routes from "./routes/auth.routes";
import user_routes from "./routes/user.routes";
import cors from "@elysiajs/cors";
import upload_routes from "./routes/upload.routes";
import { connection_routes } from "./routes/connection.routes";
import { public_routes } from "./routes/public.routes";

const app = new Elysia({ prefix: "/" })
  .all("/", "Welcome to Surfer API..!")
  .use(
    cors({
      origin: "https://surfer-frontend.vercel.app",
      credentials: true,
    })
  )
  .use(auth_routes)
  .use(public_routes)
  .use(user_routes)
  .use(upload_routes)
  .use(connection_routes)
  .listen(5000);

console.log(`[SVR]  :  Connected  :  ${new Date().toLocaleString()}`);
