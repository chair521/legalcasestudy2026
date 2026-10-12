"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, buttonClass, Field, inputClass } from "@/components/ui";
import { ENCODINGS } from "@/lib/csv";
import { importTerms, type ImportState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importTerms, {});

  return (
    <div className="space-y-4">
      {state.status === "success" && (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          <p className="font-medium">取り込みが完了しました</p>
          <p className="mt-1">
            追加 {state.inserted}件 ／ 更新 {state.updated}件 ／ スキップ（既に登録済み） {state.skipped}件
          </p>
          <Link href="/terms" className="mt-2 inline-block text-teal-700 underline">
            用語集を見る
          </Link>
        </div>
      )}

      {state.status === "error" && state.message && <Alert>{state.message}</Alert>}

      {state.errors && state.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-white">
          <p className="border-b border-red-100 px-4 py-2 text-sm font-medium text-red-700">
            エラーのある行（{state.errors.length}件）
          </p>
          <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto text-sm">
            {state.errors.map((e) => (
              <li key={e.line} className="flex gap-3 px-4 py-2">
                <span className="w-16 shrink-0 text-slate-500">{e.line}行目</span>
                <span>{e.messages.join(" / ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.duplicateLines && state.duplicateLines.length > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          ファイル内で同じ用語（日本語＋中国語）が複数ありました。後の行を採用し、{state.duplicateLines.join("・")}
          行目は無視しました。
        </p>
      )}

      <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="CSV ファイル" htmlFor="file" required>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="block text-sm" />
        </Field>

        <Field label="文字コード" htmlFor="encoding">
          <select id="encoding" name="encoding" defaultValue="auto" className={inputClass}>
            {Object.entries(ENCODINGS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">
            既に登録されている用語（日本語＋中国語が同じ）の扱い
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" value="skip" defaultChecked />
            そのまま残す（CSV の行はスキップ）
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" value="update" />
            CSV の内容で上書きする（読み・カテゴリ・メモ）
          </label>
        </fieldset>

        <button type="submit" className={buttonClass.primary} disabled={pending}>
          {pending ? "取り込み中…" : "取り込む"}
        </button>
      </form>
    </div>
  );
}
