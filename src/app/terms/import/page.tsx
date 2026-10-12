import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { MAX_IMPORT_ROWS } from "@/lib/csv";
import { ImportForm } from "./ImportForm";

export default async function ImportPage() {
  await requireUser();

  return (
    <>
      <Link href="/terms" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← 用語集へ
      </Link>
      <PageHeader title="CSV から用語を取り込む" />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ImportForm />

        <aside className="space-y-3 text-sm text-slate-600">
          <h2 className="font-bold text-slate-800">CSV の形式</h2>
          <p>1 行目は見出し行にしてください。「日本語」「中国語」は必須、そのほかの列は省略できます。</p>
          <table className="w-full rounded border border-slate-200 bg-white text-left">
            <tbody className="divide-y divide-slate-100">
              {[
                ["日本語", "必須"],
                ["中国語", "必須"],
                ["読み", "カタカナでも可"],
                ["カテゴリ", "例：契約"],
                ["メモ", "改行を含む場合は \" で囲む"],
              ].map(([col, desc]) => (
                <tr key={col}>
                  <td className="px-3 py-1.5 font-medium">{col}</td>
                  <td className="px-3 py-1.5 text-slate-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>英語の見出し（japanese, chinese, reading, category, note）でも読み込めます。</p>
          <p>一度に {MAX_IMPORT_ROWS} 行まで。Excel で保存した Shift_JIS の CSV も読み込めます。</p>
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-900">
            Shift_JIS には簡体字（例：证・师）が含まれないため、日本語版 Excel の「CSV」形式で保存すると中国語が「?」に置き換わります。
            Excel では「CSV UTF-8」形式で保存してください。
          </p>
          <a href="/terms/import/template" className="inline-block text-teal-700 underline" download>
            テンプレートをダウンロード
          </a>
        </aside>
      </div>
    </>
  );
}
