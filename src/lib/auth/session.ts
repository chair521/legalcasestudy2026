import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const COOKIE_NAME = "session";
const SESSION_DAYS = 30;

/** DB にはトークンそのものではなくハッシュを保存する（DB が漏れてもそのままログインに使えないように） */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // ついでに、このユーザーの期限切れセッションを掃除しておく
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript から読めないようにする（XSS 対策）
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // 他サイトからの POST にはクッキーを付けない（CSRF 対策）
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  cookieStore.delete(COOKIE_NAME);
}

export type CurrentUser = { id: number; email: string };

/** ログイン中のユーザーを返す。1 回のリクエスト内では結果を使い回す（React の cache） */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [row] = await db
    .select({ id: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

/** ログインが必要なページ・Server Action の先頭で呼ぶ。未ログインならログイン画面へ */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
