"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { FormState } from "@/lib/validation";

export type AuthFormState = FormState<"email" | "password">;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("メールアドレスの形式が正しくありません"));

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "パスワードは8文字以上にしてください").max(128, "パスワードは128文字以内にしてください"),
});

// ユーザーが存在しないときも同じくらい時間をかけ、応答時間から登録の有無を推測されにくくする
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const result = signupSchema.safeParse({ email, password: String(formData.get("password") ?? "") });
  if (!result.success) {
    return { values: { email }, errors: z.flattenError(result.error).fieldErrors };
  }

  const passwordHash = await hashPassword(result.data.password);
  const [created] = await db
    .insert(users)
    .values({ email: result.data.email, passwordHash })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (!created) {
    return { values: { email }, errors: { email: ["このメールアドレスは既に登録されています"] } };
  }

  await createSession(created.id);
  redirect("/terms");
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const failed: AuthFormState = { values: { email }, message: "メールアドレスまたはパスワードが違います" };

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success || password === "") return failed;

  const user = await db.query.users.findFirst({ where: eq(users.email, parsedEmail.data) });
  const ok = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH));
  if (!user || !ok) return failed;

  await createSession(user.id);
  redirect("/terms");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
