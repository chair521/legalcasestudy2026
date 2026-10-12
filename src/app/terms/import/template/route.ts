import { termsToCsv } from "@/lib/csv";

// 取り込み用のひな形（架空のサンプル 2 行入り）
export function GET() {
  const csv = termsToCsv([
    { japanese: "敷金", chinese: "押金", reading: "しききん", category: "費用", note: "退去時に原状回復費用を差し引いて返還" },
    { japanese: "委任状", chinese: "委托书", reading: "いにんじょう", category: "手続き", note: "" },
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="terms-template.csv"',
    },
  });
}
