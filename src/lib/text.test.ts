import { describe, expect, it } from "vitest";
import { normalize, toHiragana } from "./text";

describe("normalize", () => {
  it("全角英数字を半角にし、前後の空白を除く", () => {
    expect(normalize("　ＡＢＣ１２３ ")).toBe("ABC123");
  });

  it("半角カナを全角カナにする", () => {
    expect(normalize("ｹｲﾔｸ")).toBe("ケイヤク");
  });
});

describe("toHiragana", () => {
  it("カタカナをひらがなにする", () => {
    expect(toHiragana("ザイリュウシカク")).toBe("ざいりゅうしかく");
  });

  it("長音符・ひらがな・漢字はそのまま", () => {
    expect(toHiragana("ビザー契約けいやく")).toBe("びざー契約けいやく");
  });
});
