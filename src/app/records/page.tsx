import Form from "next/form";
import Link from "next/link";
import { buttonClass, inputClass, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getTerm } from "../terms/queries";
import { firstParam, parseKeywords } from "@/lib/search";
import { RECORD_LIMIT, searchRecords } from "./queries";

export default async function RecordsPage(props: PageProps<"/records">) {
  const user = await requireUser();
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const termIdParam = Number(firstParam(params.term));
  const termId = Number.isInteger(termIdParam) && termIdParam > 0 ? termIdParam : undefined;

  const [rows, term] = await Promise.all([
    searchRecords({ userId: user.id, q, termId }),
    termId ? getTerm(user.id, termId) : undefined,
  ]);
  const isFiltered = parseKeywords(q).length > 0 || termId !== undefined;

  return (
    <>
      <PageHeader title="対応記録">
        <LinkButton href="/records/new">＋ 記録を追加</LinkButton>
      </PageHeader>

      <p className="mb-4 text-sm text-slate-600">
        現場で「どの手続きで、どこで詰まり、どう説明したか」を残しておき、次の対応や用語集の改善に生かします。
      </p>

      <Form action="/records" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        {termId && <input type="hidden" name="term" value={termId} />}
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
            キーワード（件名・手続き・内容）
          </label>
          <input id="q" name="q" type="search" defaultValue={q} className={inputClass} placeholder="例：更新料" />
        </div>
        <button type="submit" className={buttonClass.primary}>
          検索
        </button>
        {isFiltered && (
          <Link href="/records" className={buttonClass.secondary}>
            クリア
          </Link>
        )}
      </Form>

      {term && (
        <p className="mb-4 text-sm">
          用語「<span className="font-medium">{term.japanese}</span>」を使った記録を表示しています。
        </p>
      )}

      <p className="mb-2 text-sm text-slate-500">
        {rows.length}件{rows.length === RECORD_LIMIT && `（新しい順に${RECORD_LIMIT}件まで表示）`}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          {isFiltered ? "条件に合う記録が見つかりませんでした。" : "まだ記録がありません。「記録を追加」から登録してください。"}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/records/${r.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-600"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm text-slate-500">{r.occurredOn}</span>
                  {r.procedure && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{r.procedure}</span>
                  )}
                  <span className="font-medium text-slate-900">{r.title}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">詰まったところ：</span>
                  {r.issue}
                </p>
                {r.recordTerms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.recordTerms.map(({ term }) => (
                      <span key={term.id} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                        {term.japanese}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
