"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { decodeCsv, type Encoding, ENCODINGS, parseTermsCsv, type RowError } from "@/lib/csv";

export type ImportState = {
  status?: "success" | "error";
  message?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: RowError[];
  duplicateLines?: number[];
};

// Server Action のリクエスト上限（既定 1MB）に収まるよう、少し余裕を持たせる
const MAX_FILE_SIZE = 900 * 1024;

const termKey = (t: { japanese: string; chinese: string }) => `${t.japanese}\u0000${t.chinese}`;

export async function importTerms(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "CSV ファイルを選択してください" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { status: "error", message: "ファイルが大きすぎます（900KB まで）。ファイルを分けて取り込んでください。" };
  }

  const encodingParam = String(formData.get("encoding") ?? "auto");
  const encoding: Encoding = Object.hasOwn(ENCODINGS, encodingParam) ? (encodingParam as Encoding) : "auto";
  const mode = formData.get("mode") === "update" ? "update" : "skip";

  let text: string;
  try {
    text = decodeCsv(new Uint8Array(await file.arrayBuffer()), encoding);
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }

  const { rows, errors, duplicateLines } = parseTermsCsv(text);
  // 一部だけ取り込まれると、どこまで入ったか分かりにくい。エラーが 1 行でもあれば全体を取り込まない
  if (errors.length > 0) {
    return {
      status: "error",
      message: "エラーがあるため、1 件も取り込みませんでした。CSV を修正してもう一度お試しください。",
      errors,
      duplicateLines,
    };
  }
  if (rows.length === 0) {
    return { status: "error", message: "取り込める行がありません" };
  }

  const counts = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ japanese: terms.japanese, chinese: terms.chinese })
      .from(terms)
      .where(eq(terms.userId, user.id));
    const existingKeys = new Set(existing.map(termKey));
    const newCount = rows.filter((r) => !existingKeys.has(termKey(r.data))).length;
    const existingCount = rows.length - newCount;

    const insert = tx.insert(terms).values(rows.map((r) => ({ ...r.data, userId: user.id })));
    const target = [terms.userId, terms.japanese, terms.chinese];

    if (mode === "update") {
      // 既にある用語は、読み・カテゴリ・メモを CSV の内容で上書きする（excluded = 挿入しようとした行）
      await insert.onConflictDoUpdate({
        target,
        set: {
          reading: sql.raw(`excluded.${terms.reading.name}`),
          category: sql.raw(`excluded.${terms.category.name}`),
          note: sql.raw(`excluded.${terms.note.name}`),
          updatedAt: new Date(),
        },
      });
      return { inserted: newCount, updated: existingCount, skipped: 0 };
    }

    await insert.onConflictDoNothing({ target });
    return { inserted: newCount, updated: 0, skipped: existingCount };
  });

  revalidatePath("/terms");
  return { status: "success", ...counts, duplicateLines };
}
