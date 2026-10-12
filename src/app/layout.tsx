import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "通訳ナレッジ帳",
  description: "中日通訳のための用語集と対応記録の管理アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/terms" className="text-lg font-bold text-teal-800">
              通訳ナレッジ帳
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/terms" className="hover:text-teal-700">
                用語集
              </Link>
              <Link href="/records" className="hover:text-teal-700">
                対応記録
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
