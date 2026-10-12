import { and, asc, desc, eq, ilike, inArray, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { records, recordTerms, terms } from "@/db/schema";
import { keywordPatterns, parseKeywords } from "@/lib/search";

export const RECORD_LIMIT = 100;

export async function searchRecords({ q, termId }: { q: string; termId?: number }) {
  const conditions: SQL[] = [];

  for (const keyword of parseKeywords(q)) {
    const { text } = keywordPatterns(keyword);
    conditions.push(
      or(
        ilike(records.title, text),
        ilike(records.procedure, text),
        ilike(records.situation, text),
        ilike(records.issue, text),
        ilike(records.explanation, text),
        ilike(records.improvement, text),
      )!,
    );
  }

  if (termId) {
    // この用語が関連づけられた記録だけ
    conditions.push(
      inArray(records.id, db.select({ id: recordTerms.recordId }).from(recordTerms).where(eq(recordTerms.termId, termId))),
    );
  }

  return db.query.records.findMany({
    where: and(...conditions),
    orderBy: [desc(records.occurredOn), desc(records.id)],
    limit: RECORD_LIMIT,
    with: { recordTerms: { with: { term: { columns: { id: true, japanese: true } } } } },
  });
}

export async function getRecord(id: number) {
  return db.query.records.findFirst({
    where: eq(records.id, id),
    with: { recordTerms: { with: { term: true } } },
  });
}

/** フォームの用語選択に使う、全用語の一覧（軽い列だけ） */
export async function getTermOptions() {
  return db
    .select({ id: terms.id, japanese: terms.japanese, chinese: terms.chinese, reading: terms.reading })
    .from(terms)
    .orderBy(asc(terms.reading), asc(terms.japanese));
}

/** 手続きの種類の入力候補 */
export async function getProcedures(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ procedure: records.procedure })
    .from(records)
    .where(ne(records.procedure, ""))
    .orderBy(asc(records.procedure));
  return rows.map((r) => r.procedure);
}
