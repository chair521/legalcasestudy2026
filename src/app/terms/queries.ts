import { and, asc, count, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { keywordPatterns, parseKeywords, type SortKey } from "@/lib/search";

const DEFAULT_CATEGORIES = ["契約", "費用", "手続き"];
export const PAGE_SIZE = 50;
/** カテゴリ絞り込みで「未分類」を表す値 */
export const UNCATEGORIZED = "__none__";

/** カテゴリ入力の候補（既定の候補＋登録済みのカテゴリ） */
export async function getCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: terms.category })
    .from(terms)
    .where(ne(terms.category, ""))
    .orderBy(asc(terms.category));
  return [...new Set([...DEFAULT_CATEGORIES, ...rows.map((r) => r.category)])];
}

/** 絞り込み用：登録済みのカテゴリと件数 */
export async function getCategoryCounts() {
  return db
    .select({ category: terms.category, count: count() })
    .from(terms)
    .groupBy(terms.category)
    .orderBy(asc(terms.category));
}

type SearchParams = { q: string; category: string; sort: SortKey; page: number };

export async function searchTerms({ q, category, sort, page }: SearchParams) {
  const conditions: SQL[] = [];

  if (category === UNCATEGORIZED) {
    conditions.push(eq(terms.category, ""));
  } else if (category) {
    conditions.push(eq(terms.category, category));
  }

  // キーワードが複数あるときは「すべてを含む」（AND）。各キーワードはどれかの列に含まれればよい（OR）
  for (const keyword of parseKeywords(q)) {
    const p = keywordPatterns(keyword);
    conditions.push(
      or(
        ilike(terms.japanese, p.text),
        ilike(terms.chinese, p.text),
        ilike(terms.reading, p.reading),
        ilike(terms.note, p.text),
      )!,
    );
  }

  const where = and(...conditions);
  const orderBy =
    sort === "reading"
      ? // 読みが空の用語は最後に回す
        [sql`${terms.reading} = ''`, asc(terms.reading), asc(terms.japanese)]
      : [desc(terms.updatedAt), desc(terms.id)];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(terms)
      .where(where)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(terms).where(where),
  ]);

  return { rows, total };
}
