import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { login } from "../actions";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "ログイン | 通訳ナレッジ帳" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/terms");

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="mb-1 text-xl font-bold">ログイン</h1>
      <p className="mb-6 text-sm text-slate-500">中日通訳のための用語集と対応記録</p>
      <AuthForm action={login} submitLabel="ログイン" />
      <p className="mt-6 text-center text-sm text-slate-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-teal-700 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
