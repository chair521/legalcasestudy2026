"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Term } from "@/db/schema";
import { Alert, buttonClass, Field, inputClass } from "@/components/ui";
import type { TermFormState } from "./actions";

type Props = {
  action: (prev: TermFormState, formData: FormData) => Promise<TermFormState>;
  term?: Term;
  categories: string[];
  submitLabel: string;
};

export function TermForm({ action, term, categories, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // エラーで戻ってきたときは送信した値、それ以外は既存の値を表示する
  const value = (key: keyof NonNullable<TermFormState["values"]>) => state.values?.[key] ?? term?.[key] ?? "";

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.message && <Alert>{state.message}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="日本語" htmlFor="japanese" required errors={state.errors?.japanese}>
          <input id="japanese" name="japanese" defaultValue={value("japanese")} className={inputClass} autoFocus />
        </Field>
        <Field label="中国語" htmlFor="chinese" required errors={state.errors?.chinese}>
          <input id="chinese" name="chinese" defaultValue={value("chinese")} className={inputClass} lang="zh" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="読み" htmlFor="reading" hint="カタカナで入力してもひらがなで保存されます" errors={state.errors?.reading}>
          <input id="reading" name="reading" defaultValue={value("reading")} className={inputClass} />
        </Field>
        <Field label="カテゴリ" htmlFor="category" hint="例：契約、費用、手続き" errors={state.errors?.category}>
          <input id="category" name="category" defaultValue={value("category")} className={inputClass} list="category-options" />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="メモ" htmlFor="note" hint="使い分け、言い換え、注意点など" errors={state.errors?.note}>
        <textarea id="note" name="note" rows={4} defaultValue={value("note")} className={inputClass} />
      </Field>

      <div className="flex gap-3">
        <button type="submit" className={buttonClass.primary} disabled={pending}>
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link href="/terms" className={buttonClass.secondary}>
          キャンセル
        </Link>
      </div>
    </form>
  );
}
