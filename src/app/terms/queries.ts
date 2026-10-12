import { asc, ne } from "drizzle-orm";
import { db } from "@/db";
import { terms } from "@/db/schema";

const DEFAULT_CATEGORIES = ["契約", "費用", "手続き"];

/** カテゴリ入力の候補（既定の候補＋登録済みのカテゴリ） */
export async function getCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: terms.category })
    .from(terms)
    .where(ne(terms.category, ""))
    .orderBy(asc(terms.category));
  return [...new Set([...DEFAULT_CATEGORIES, ...rows.map((r) => r.category)])];
}
