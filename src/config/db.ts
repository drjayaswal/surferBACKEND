import { drizzle } from "drizzle-orm/postgres-js";
import "dotenv/config";
import postgres from "postgres";

const db_connect = () => {
  try {
    if (
      !process.env.DB_HOST &&
      !process.env.DB_PORT &&
      !process.env.DB_NAME &&
      !process.env.DB_USER &&
      !process.env.DB_PASSWORD
    ) {
      console.log(`[DB]  :  NO HOST & PORT  :  ${new Date().toLocaleString()}`);
    }

    const client = postgres({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      password: process.env.DB_PASSWORD,
      ssl: "require", // important for deployment

      debug: function (_, query) {
        console.log(
          `[DB]  :  QUERY EXECUTED  :  ${new Date().toLocaleString()}`
        );
      },
    });

    const db = drizzle({ client: client });

    console.log(`[DB]   :  Connected  :   ${new Date().toLocaleString()}`);

    return db;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
const db = db_connect();

export default db;
