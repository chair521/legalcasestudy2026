import { connection } from "next/server";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { DeleteButton } from "@/components/DeleteButton";
import { LinkButton, PageHeader } from "@/components/ui";
import { deleteTerm } from "./actions";

export default async function TermsPage() {
  // DB の内容はリクエストごとに変わるので、ビルド時に静的生成させない
  await connection();
  const rows = await db.select().from(terms).orderBy(desc(terms.updatedAt));

  return (
    <>
      <PageHeader title="用語集">
        <LinkButton href="/terms/new">＋ 用語を追加</LinkButton>
      </PageHeader>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          まだ用語がありません。「用語を追加」から登録してください。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">日本語</th>
                <th className="px-4 py-2 font-medium">中国語</th>
                <th className="px-4 py-2 font-medium">読み</th>
                <th className="px-4 py-2 font-medium">カテゴリ</th>
                <th className="px-4 py-2 font-medium">メモ</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.japanese}</td>
                  <td className="px-4 py-3" lang="zh">
                    {t.chinese}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.reading}</td>
                  <td className="px-4 py-3">
                    {t.category && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800">{t.category}</span>
                    )}
                  </td>
                  <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-slate-600">{t.note}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/terms/${t.id}/edit`} className="mr-2 text-teal-700 hover:underline">
                      編集
                    </Link>
                    <DeleteButton
                      action={deleteTerm.bind(null, t.id)}
                      confirmMessage={`「${t.japanese}」を削除しますか？`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
