import { z } from "zod";
import { normalize, toHiragana } from "./text";

const maxMsg = (max: number) => `${max}文字以内で入力してください`;

// 用語そのもの（日本語・中国語・読み・カテゴリ）は検索でヒットしやすいよう NFKC で正規化する
const text = (max: number) => z.string().transform(normalize).pipe(z.string().max(max, maxMsg(max)));
// メモは書いたとおりに残したいので、前後の空白を除くだけにする
const freeText = (max: number) => z.string().trim().max(max, maxMsg(max));
const required = (label: string, max: number) =>
  z
    .string()
    .transform(normalize)
    .pipe(z.string().min(1, `${label}を入力してください`).max(max, maxMsg(max)));

export const termInputSchema = z.object({
  japanese: required("日本語", 200),
  chinese: required("中国語", 200),
  reading: text(200).transform(toHiragana),
  category: text(50),
  note: freeText(2000),
});

export type TermInput = z.infer<typeof termInputSchema>;
export const termFields = ["japanese", "chinese", "reading", "category", "note"] as const;

/** FormData から指定したキーを文字列として取り出す（未入力は空文字） */
export function pickFormValues<K extends string>(formData: FormData, keys: readonly K[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")])) as Record<K, string>;
}

/** Server Action からフォームへ返す状態 */
export type FormState<K extends string> = {
  errors?: Partial<Record<K, string[]>>;
  message?: string;
  // エラー時に入力内容を保持するため、送信された値をそのまま返す
  values?: Partial<Record<K, string>>;
};

export const recordInputSchema = z.object({
  title: required("件名", 100),
  occurredOn: z.iso.date("日付を正しく入力してください"),
  procedure: text(100),
  situation: freeText(5000),
  issue: freeText(5000).pipe(z.string().min(1, "詰まったところを入力してください")),
  explanation: freeText(5000).pipe(z.string().min(1, "どう説明したかを入力してください")),
  improvement: freeText(5000),
  termIds: z.array(z.coerce.number().int().positive()).max(100, "関連づけられる用語は100件までです"),
});

export type RecordInput = z.infer<typeof recordInputSchema>;
export const recordFields = ["title", "occurredOn", "procedure", "situation", "issue", "explanation", "improvement"] as const;

/** 日本時間での今日の日付（YYYY-MM-DD） */
export function todayInJapan(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}
