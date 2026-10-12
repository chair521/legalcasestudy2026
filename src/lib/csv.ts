import Papa from "papaparse";
import { z } from "zod";
import { type TermInput, termInputSchema } from "./validation";

type TermField = keyof TermInput;

/** 書き出し時のヘッダー（Excel で開いたときに読みやすい日本語） */
export const CSV_HEADERS: Record<TermField, string> = {
  japanese: "日本語",
  chinese: "中国語",
  reading: "読み",
  category: "カテゴリ",
  note: "メモ",
};

/** 取り込み時に受け付けるヘッダー名（日本語・中国語・英語の表記ゆれに対応） */
const HEADER_ALIASES = new Map<string, TermField>(
  Object.entries({
  japanese: "japanese", 日本語: "japanese",
  chinese: "chinese", 中国語: "chinese", 中文: "chinese", 中国语: "chinese",
  reading: "reading", 読み: "reading", よみ: "reading", 読み仮名: "reading", ふりがな: "reading",
  category: "category", カテゴリ: "category", カテゴリー: "category", 分類: "category", 类别: "category",
  note: "note", メモ: "note", 備考: "note", 备注: "note",
  } satisfies Record<string, TermField>),
);

export const MAX_IMPORT_ROWS = 2000;

export const ENCODINGS = {
  auto: "自動判定（UTF-8 → Shift_JIS → GB18030）",
  "utf-8": "UTF-8",
  shift_jis: "Shift_JIS（日本語版 Excel の「CSV」形式）",
  gb18030: "GB18030 / GBK（中国語版 Excel）",
} as const;
export type Encoding = keyof typeof ENCODINGS;

/**
 * バイト列を文字列にする。
 * 日本語版 Excel で保存した CSV は Shift_JIS になることが多いので、UTF-8 として読めなければ順に試す。
 */
export function decodeCsv(bytes: Uint8Array, encoding: Encoding = "auto"): string {
  const candidates = encoding === "auto" ? (["utf-8", "shift_jis", "gb18030"] as const) : [encoding];
  for (const enc of candidates) {
    try {
      // fatal: true で、その文字コードとして不正なバイト列があれば例外にする
      const text = new TextDecoder(enc, { fatal: true }).decode(bytes);
      return text.replace(/^﻿/, ""); // BOM を除く
    } catch {
      // 次の候補を試す
    }
  }
  throw new Error("文字コードを判定できませんでした。UTF-8 で保存し直すか、文字コードを指定してください。");
}

export type ParsedRow = { line: number; data: TermInput };
export type RowError = { line: number; messages: string[] };

export type ParseResult = {
  rows: ParsedRow[];
  errors: RowError[];
  /** ファイル内で同じ「日本語＋中国語」が複数あった行（後の行を採用） */
  duplicateLines: number[];
};

/** Excel の数式インジェクション対策で書き出し時に付けた先頭の ' を外す */
function unescapeFormula(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

export function parseTermsCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => HEADER_ALIASES.get(h.trim().toLowerCase()) ?? h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  const missing = (["japanese", "chinese"] as const).filter((f) => !fields.includes(f));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, messages: [`ヘッダー行に「${missing.map((f) => CSV_HEADERS[f]).join("」「")}」の列が必要です`] }],
      duplicateLines: [],
    };
  }
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      errors: [{ line: 1, messages: [`一度に取り込めるのは ${MAX_IMPORT_ROWS} 行までです（${parsed.data.length} 行あります）`] }],
      duplicateLines: [],
    };
  }

  const errors: RowError[] = [];
  const byKey = new Map<string, ParsedRow>();
  const duplicateLines: number[] = [];

  parsed.data.forEach((raw, i) => {
    const line = i + 2; // 1 行目はヘッダー
    const values = Object.fromEntries(
      (Object.keys(CSV_HEADERS) as TermField[]).map((f) => [f, unescapeFormula(raw[f] ?? "")]),
    );
    const result = termInputSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      errors.push({
        line,
        messages: Object.entries(fieldErrors).flatMap(([f, msgs]) =>
          (msgs ?? []).map((m) => `${CSV_HEADERS[f as TermField]}：${m}`),
        ),
      });
      return;
    }
    // 同じ用語が 1 回の INSERT ... ON CONFLICT に 2 回含まれると PostgreSQL がエラーにするので、ここで 1 つにまとめる
    const key = `${result.data.japanese}\u0000${result.data.chinese}`;
    const previous = byKey.get(key);
    if (previous) duplicateLines.push(previous.line);
    byKey.set(key, { line, data: result.data });
  });

  for (const e of parsed.errors) {
    if (e.row !== undefined) errors.push({ line: e.row + 2, messages: [`CSV の形式が正しくありません（${e.message}）`] });
  }

  return { rows: [...byKey.values()].sort((a, b) => a.line - b.line), errors, duplicateLines };
}

export function termsToCsv(terms: TermInput[]): string {
  const csv = Papa.unparse(
    {
      fields: Object.values(CSV_HEADERS),
      data: terms.map((t) => (Object.keys(CSV_HEADERS) as TermField[]).map((f) => t[f])),
    },
    {
      newline: "\r\n",
      // = や + で始まるセルが Excel で数式として実行されないよう、先頭に ' を付ける
      escapeFormulae: true,
    },
  );
  // BOM を付けると、Excel でダブルクリックして開いても UTF-8 として文字化けせずに表示される
  return `﻿${csv}\r\n`;
}
