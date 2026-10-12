"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui";
import { normalize, toHiragana } from "@/lib/text";

export type TermOption = { id: number; japanese: string; chinese: string; reading: string };

/** 対応記録に関連づける用語を選ぶ。選択中の用語は hidden input の termIds として送信される */
export function TermPicker({ options, defaultSelected }: { options: TermOption[]; defaultSelected: number[] }) {
  const [selected, setSelected] = useState<number[]>(defaultSelected);
  const [filter, setFilter] = useState("");

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const candidates = useMemo(() => {
    const q = normalize(filter).toLowerCase();
    if (!q) return options.slice(0, 30);
    const hira = toHiragana(q);
    return options
      .filter(
        (o) => o.japanese.toLowerCase().includes(q) || o.chinese.toLowerCase().includes(q) || o.reading.includes(hira),
      )
      .slice(0, 30);
  }, [filter, options]);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-2">
      {selected.map((id) => (
        <input key={id} type="hidden" name="termIds" value={id} />
      ))}

      <div className="flex min-h-9 flex-wrap gap-2">
        {selected.length === 0 && <span className="text-sm text-slate-400">選択された用語はありません</span>}
        {selected.map((id) => {
          const term = byId.get(id);
          if (!term) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className="rounded-full bg-teal-700 px-3 py-1 text-xs text-white hover:bg-teal-800"
              aria-label={`${term.japanese} を外す`}
            >
              {term.japanese} ×
            </button>
          );
        })}
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-slate-500">用語集に用語を登録すると、ここで選べるようになります。</p>
      ) : (
        <div className="rounded-md border border-slate-200 p-3">
          <input
            id="term-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="用語を絞り込む（日本語・中国語・読み）"
            className={inputClass}
          />
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {candidates.map((o) => (
              <li key={o.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50">
                  <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                  <span className="font-medium">{o.japanese}</span>
                  <span className="text-slate-500" lang="zh">
                    {o.chinese}
                  </span>
                </label>
              </li>
            ))}
            {candidates.length === 0 && <li className="px-2 py-1 text-slate-400">該当する用語がありません</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
