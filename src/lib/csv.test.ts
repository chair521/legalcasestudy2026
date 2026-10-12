import { describe, expect, it } from "vitest";
import { decodeCsv, parseTermsCsv, termsToCsv } from "./csv";

const encoder = new TextEncoder();

describe("decodeCsv", () => {
  it("UTF-8（BOM 付き）を読める", () => {
    const bytes = encoder.encode("﻿日本語,中国語\n契約,合同");
    expect(decodeCsv(bytes)).toBe("日本語,中国語\n契約,合同");
  });

  it("Shift_JIS を自動判定で読める", () => {
    // 「契約」の Shift_JIS 表現
    const sjis = new Uint8Array([0x8c, 0x5f, 0x96, 0xf1]);
    expect(decodeCsv(sjis)).toBe("契約");
  });
});

describe("parseTermsCsv", () => {
  it("日本語ヘッダーでも英語ヘッダーでも読める", () => {
    const ja = parseTermsCsv("日本語,中国語,読み,カテゴリ,メモ\n敷金,押金,シキキン,費用,返還あり");
    const en = parseTermsCsv("japanese,chinese,reading,category,note\n敷金,押金,しききん,費用,返還あり");
    expect(ja.rows[0].data).toEqual({
      japanese: "敷金",
      chinese: "押金",
      reading: "しききん",
      category: "費用",
      note: "返還あり",
    });
    expect(en.rows[0].data).toEqual(ja.rows[0].data);
  });

  it("読み・カテゴリ・メモの列は省略できる", () => {
    const r = parseTermsCsv("日本語,中国語\n解約,解除合同");
    expect(r.errors).toEqual([]);
    expect(r.rows[0].data.reading).toBe("");
  });

  it("必須列がないとヘッダーエラー", () => {
    const r = parseTermsCsv("日本語,読み\n解約,かいやく");
    expect(r.rows).toEqual([]);
    expect(r.errors[0].messages[0]).toContain("中国語");
  });

  it("不正な行は行番号付きでエラーにする", () => {
    const r = parseTermsCsv("日本語,中国語\n敷金,押金\n,押金\n礼金,礼金");
    expect(r.rows.map((x) => x.line)).toEqual([2, 4]);
    expect(r.errors).toEqual([{ line: 3, messages: ["日本語：日本語を入力してください"] }]);
  });

  it("ファイル内の重複は後の行を採用する", () => {
    const r = parseTermsCsv("日本語,中国語,メモ\n敷金,押金,古い\n礼金,礼金,\n敷金,押金,新しい");
    expect(r.rows.map((x) => [x.line, x.data.note])).toEqual([
      [3, ""],
      [4, "新しい"],
    ]);
    expect(r.duplicateLines).toEqual([2]);
  });

  it("改行やカンマを含むセルも読める", () => {
    const r = parseTermsCsv('日本語,中国語,メモ\n契約書,合同,"1行目\n2行目, カンマ"');
    expect(r.rows[0].data.note).toBe("1行目\n2行目, カンマ");
  });
});

describe("termsToCsv", () => {
  const term = { japanese: "敷金", chinese: "押金", reading: "しききん", category: "費用", note: "=SUM(A1)" };

  it("BOM と日本語ヘッダーを付け、数式になりうるセルをエスケープする", () => {
    const csv = termsToCsv([term]);
    expect(csv.startsWith("﻿日本語,中国語,読み,カテゴリ,メモ\r\n")).toBe(true);
    expect(csv).toContain("'=SUM(A1)");
  });

  it("書き出した CSV をそのまま取り込むと元に戻る", () => {
    const csv = termsToCsv([term, { ...term, japanese: "礼金", chinese: "礼金", note: 'カンマ, と "引用符"' }]);
    const r = parseTermsCsv(decodeCsv(encoder.encode(csv)));
    expect(r.errors).toEqual([]);
    expect(r.rows.map((x) => x.data)).toEqual([
      term,
      { ...term, japanese: "礼金", chinese: "礼金", note: 'カンマ, と "引用符"' },
    ]);
  });
});
