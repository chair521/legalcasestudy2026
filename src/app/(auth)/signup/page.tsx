import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { signup } from "../actions";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "新規登録 | 通訳ナレッジ帳" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/terms");

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="mb-6 text-xl font-bold">新規登録</h1>
      <AuthForm action={signup} submitLabel="登録する" passwordHint="8文字以上" isSignup />
      <p className="mt-6 text-center text-sm text-slate-600">
        登録済みの方は{" "}
        <Link href="/login" className="text-teal-700 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
