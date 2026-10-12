import Form from "next/form";
import Link from "next/link";
import { inputClass, buttonClass } from "@/components/ui";
import { SORT_OPTIONS, type SortKey } from "@/lib/search";
import { UNCATEGORIZED } from "./queries";

type Props = {
  q: string;
  category: string;
  sort: SortKey;
  categoryCounts: { category: string; count: number }[];
};

/** GET で /terms に送るだけの検索フォーム。条件が URL に残るので、共有やブラウザの戻るにも対応できる */
export function SearchForm({ q, category, sort, categoryCounts }: Props) {
  const hasFilter = q !== "" || category !== "";

  return (
    <Form
      action="/terms"
      className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="min-w-56 flex-1">
        <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
          キーワード（日本語・中国語・読み・メモ）
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="例：在留  /  合同  /  けいやく"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-xs font-medium text-slate-600">
          カテゴリ
        </label>
        <select id="category" name="category" defaultValue={category} className={inputClass}>
          <option value="">すべて</option>
          {categoryCounts.map(({ category: c, count }) => (
            <option key={c || UNCATEGORIZED} value={c || UNCATEGORIZED}>
              {c || "（未分類）"}（{count}）
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sort" className="mb-1 block text-xs font-medium text-slate-600">
          並び順
        </label>
        <select id="sort" name="sort" defaultValue={sort} className={inputClass}>
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={buttonClass.primary}>
        検索
      </button>
      {hasFilter && (
        <Link href="/terms" className={buttonClass.secondary}>
          クリア
        </Link>
      )}
    </Form>
  );
}
