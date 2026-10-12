import { describe, expect, it } from "vitest";
import { escapeLike, keywordPatterns, parseKeywords, parsePage, parseSort } from "./search";

describe("parseKeywords", () => {
  it("半角・全角スペースで区切る", () => {
    expect(parseKeywords("契約　費用 手続き")).toEqual(["契約", "費用", "手続き"]);
  });

  it("空白だけなら空配列", () => {
    expect(parseKeywords("　 ")).toEqual([]);
  });

  it("キーワード数に上限を設ける", () => {
    expect(parseKeywords("a b c d e f g", 3)).toEqual(["a", "b", "c"]);
  });
});

describe("escapeLike", () => {
  it("% と _ と \\ をエスケープする", () => {
    expect(escapeLike("100%_\\")).toBe("100\\%\\_\\\\");
  });
});

describe("keywordPatterns", () => {
  it("読み用のパターンはひらがなにそろえる", () => {
    expect(keywordPatterns("ケイヤク")).toEqual({ text: "%ケイヤク%", reading: "%けいやく%" });
  });
});

describe("parseSort / parsePage", () => {
  it("不正な値は既定値にする", () => {
    expect(parseSort("drop table")).toBe("updated");
    expect(parseSort("constructor")).toBe("updated");
    expect(parseSort("reading")).toBe("reading");
    expect(parsePage("-1")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("3")).toBe(3);
  });
});
