import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL が設定されていません（.env.example を参照）");
}

// 開発中はホットリロードのたびに接続が増えないよう、クライアントを使い回す
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// prepare: false は Supabase / Neon のコネクションプーラー（transaction mode）対策
const client = globalForDb.pgClient ?? postgres(url, { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
