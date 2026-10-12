import { normalize, toHiragana } from "./text";

/** LIKE / ILIKE のワイルドカード（% と _）とエスケープ文字を無効化する */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * 検索欄の入力をキーワードに分ける。
 * 全角スペースも NFKC で半角になるので、「契約　費用」のような入力も 2 語として扱える。
 */
export function parseKeywords(q: string, limit = 5): string[] {
  return normalize(q).split(/\s+/).filter(Boolean).slice(0, limit);
}

/** 1 つのキーワードから、各列に当てる部分一致パターンを作る */
export function keywordPatterns(keyword: string) {
  return {
    // 日本語・中国語・メモ用
    text: `%${escapeLike(keyword)}%`,
    // 読みはひらがなで保存しているので、カタカナで検索されてもヒットするようにそろえる
    reading: `%${escapeLike(toHiragana(keyword))}%`,
  };
}

/** 一覧の並び順 */
export const SORT_OPTIONS = {
  updated: "更新が新しい順",
  reading: "読み（五十音順）",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;

export function parseSort(value: string | undefined): SortKey {
  return value && Object.hasOwn(SORT_OPTIONS, value) ? (value as SortKey) : "updated";
}

export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** searchParams の値（string | string[] | undefined）を 1 つの文字列にする */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
