import Link from "next/link";
import type { Term } from "@/db/schema";
import { DeleteButton } from "@/components/DeleteButton";
import { Highlight } from "@/components/Highlight";
import { buttonClass, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { firstParam, parseKeywords, parsePage, parseSort } from "@/lib/search";
import { toHiragana } from "@/lib/text";
import { deleteTerm } from "./actions";
import { getCategoryCounts, getRecordCounts, PAGE_SIZE, searchTerms } from "./queries";
import { SearchForm } from "./SearchForm";

function CategoryBadge({ category }: { category: string }) {
  if (!category) return null;
  return (
    <Link
      href={`/terms?category=${encodeURIComponent(category)}`}
      className="whitespace-nowrap rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800 hover:bg-teal-100"
    >
      {category}
    </Link>
  );
}

function TermActions({ term, recordCount }: { term: Term; recordCount?: number }) {
  return (
    <>
      {recordCount !== undefined && (
        <Link href={`/records?term=${term.id}`} className="mr-3 text-slate-500 hover:text-teal-700 hover:underline">
          記録 {recordCount}件
        </Link>
      )}
      <Link href={`/terms/${term.id}/edit`} className="mr-2 text-teal-700 hover:underline">
        編集
      </Link>
      <DeleteButton action={deleteTerm.bind(null, term.id)} confirmMessage={`「${term.japanese}」を削除しますか？`} />
    </>
  );
}

export default async function TermsPage(props: PageProps<"/terms">) {
  const user = await requireUser();
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const category = firstParam(params.category) ?? "";
  const sort = parseSort(firstParam(params.sort));
  const page = parsePage(firstParam(params.page));

  const [{ rows, total }, categoryCounts] = await Promise.all([
    searchTerms({ userId: user.id, q, category, sort, page }),
    getCategoryCounts(user.id),
  ]);
  const recordCounts = await getRecordCounts(rows.map((t) => t.id));

  const keywords = parseKeywords(q);
  const readingKeywords = keywords.map(toHiragana);
  const isFiltered = keywords.length > 0 || category !== "";
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (sort !== "updated") sp.set("sort", sort);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/terms?${s}` : "/terms";
  };

  return (
    <>
      <PageHeader title="用語集">
        <LinkButton href="/terms/import" variant="secondary">
          CSV 取り込み
        </LinkButton>
        <a href="/terms/export" className={buttonClass.secondary} download>
          CSV 書き出し
        </a>
        <LinkButton href="/terms/new">＋ 用語を追加</LinkButton>
      </PageHeader>

      <SearchForm q={q} category={category} sort={sort} categoryCounts={categoryCounts} />

      <p className="mb-2 text-sm text-slate-500">
        {total}件{total > PAGE_SIZE && `中 ${(page - 1) * PAGE_SIZE + 1}〜${Math.min(page * PAGE_SIZE, total)}件を表示`}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          {isFiltered
            ? "条件に合う用語が見つかりませんでした。キーワードを短くするか、カテゴリを「すべて」にしてみてください。"
            : "まだ用語がありません。「用語を追加」から登録してください。"}
        </p>
      ) : (
        <>
          {/* スマートフォンではカード表示 */}
          <ul className="space-y-3 md:hidden">
            {rows.map((t) => (
              <li key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-slate-900">
                    <Highlight text={t.japanese} keywords={keywords} />
                  </span>
                  <span className="text-slate-500">
                    <Highlight text={t.reading} keywords={readingKeywords} />
                  </span>
                  <CategoryBadge category={t.category} />
                </div>
                <p className="mt-1" lang="zh">
                  <Highlight text={t.chinese} keywords={keywords} />
                </p>
                {t.note && (
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    <Highlight text={t.note} keywords={keywords} />
                  </p>
                )}
                <div className="mt-2 text-right">
                  <TermActions term={t} recordCount={recordCounts.get(t.id)} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">日本語</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">中国語</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">読み</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">カテゴリ</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">メモ</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Highlight text={t.japanese} keywords={keywords} />
                    </td>
                    <td className="px-4 py-3" lang="zh">
                      <Highlight text={t.chinese} keywords={keywords} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <Highlight text={t.reading} keywords={readingKeywords} />
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-slate-600">
                      <Highlight text={t.note} keywords={keywords} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <TermActions term={t} recordCount={recordCounts.get(t.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {lastPage > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-teal-700 hover:underline">
              ← 前へ
            </Link>
          ) : (
            <span className="text-slate-300">← 前へ</span>
          )}
          <span className="text-slate-500">
            {page} / {lastPage}
          </span>
          {page < lastPage ? (
            <Link href={pageHref(page + 1)} className="text-teal-700 hover:underline">
              次へ →
            </Link>
          ) : (
            <span className="text-slate-300">次へ →</span>
          )}
        </nav>
      )}
    </>
  );
}
