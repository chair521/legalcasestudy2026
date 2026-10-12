/** 検索キーワードに一致した部分を <mark> で強調表示する */
export function Highlight({ text, keywords }: { text: string; keywords: string[] }) {
  if (keywords.length === 0 || text === "") return text;

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  const lower = keywords.map((k) => k.toLowerCase());

  return parts.map((part, i) =>
    lower.includes(part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-amber-100 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
