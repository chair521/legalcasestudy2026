import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-xl font-bold">ページが見つかりません</h1>
      <p className="mb-6 text-slate-500">削除されたか、URL が間違っている可能性があります。</p>
      <Link href="/terms" className="text-teal-700 hover:underline">
        用語集へ戻る
      </Link>
    </div>
  );
}
