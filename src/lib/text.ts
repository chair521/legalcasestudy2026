/**
 * 入力の表記ゆれをそろえる。
 * NFKC 正規化で「全角英数字→半角」「半角カナ→全角カナ」になり、前後の空白も除く。
 */
export function normalize(input: string): string {
  return input.normalize("NFKC").trim();
}

/** カタカナをひらがなに変換する（ァ〜ヶ の範囲のみ。長音符「ー」はそのまま） */
export function toHiragana(input: string): string {
  return input.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}
