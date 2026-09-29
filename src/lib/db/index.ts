import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { serverEnvironment } from "@/lib/env";
import * as schema from "./schema";

const globalDatabase = globalThis as typeof globalThis & { alanaPool?: mysql.Pool };
const pool = globalDatabase.alanaPool ?? mysql.createPool({ uri: serverEnvironment().DATABASE_URL, connectionLimit: 10 });
if (process.env.NODE_ENV !== "production") globalDatabase.alanaPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
