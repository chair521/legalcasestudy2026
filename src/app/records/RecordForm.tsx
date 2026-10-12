"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { RecordRow } from "@/db/schema";
import type { recordFields } from "@/lib/validation";
import { Alert, buttonClass, Field, inputClass } from "@/components/ui";
import type { RecordFormState } from "./actions";
import { type TermOption, TermPicker } from "./TermPicker";

type Props = {
  action: (prev: RecordFormState, formData: FormData) => Promise<RecordFormState>;
  record?: RecordRow;
  selectedTermIds?: number[];
  termOptions: TermOption[];
  procedures: string[];
  defaultDate: string;
  submitLabel: string;
  cancelHref: string;
};

export function RecordForm(props: Props) {
  const { action, record, termOptions, procedures, defaultDate, submitLabel, cancelHref } = props;
  const [state, formAction, pending] = useActionState(action, {});
  const value = (key: (typeof recordFields)[number]) => state.values?.[key] ?? record?.[key] ?? "";

  return (
    <form action={formAction} className="max-w-3xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.message && <Alert>{state.message}</Alert>}

      <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
        <Field label="件名" htmlFor="title" required errors={state.errors?.title}>
          <input
            id="title"
            name="title"
            defaultValue={value("title")}
            className={inputClass}
            placeholder="例：更新料の必要性が伝わらなかった"
          />
        </Field>
        <Field label="対応日" htmlFor="occurredOn" required errors={state.errors?.occurredOn}>
          <input
            id="occurredOn"
            name="occurredOn"
            type="date"
            defaultValue={value("occurredOn") || defaultDate}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="手続きの種類" htmlFor="procedure" hint="例：在留期間更新、賃貸契約、転入届" errors={state.errors?.procedure}>
        <input id="procedure" name="procedure" defaultValue={value("procedure")} className={inputClass} list="procedure-options" />
        <datalist id="procedure-options">
          {procedures.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>

      <Field label="状況" htmlFor="situation" hint="どんな場面だったか（個人が特定できる情報は書かない）" errors={state.errors?.situation}>
        <textarea id="situation" name="situation" rows={3} defaultValue={value("situation")} className={inputClass} />
      </Field>

      <Field label="どこで詰まったか" htmlFor="issue" required errors={state.errors?.issue}>
        <textarea id="issue" name="issue" rows={3} defaultValue={value("issue")} className={inputClass} />
      </Field>

      <Field label="どう説明したか" htmlFor="explanation" required errors={state.errors?.explanation}>
        <textarea id="explanation" name="explanation" rows={4} defaultValue={value("explanation")} className={inputClass} />
      </Field>

      <Field label="次回への改善" htmlFor="improvement" hint="次に同じ場面が来たらどうするか" errors={state.errors?.improvement}>
        <textarea id="improvement" name="improvement" rows={3} defaultValue={value("improvement")} className={inputClass} />
      </Field>

      <Field label="使った用語" htmlFor="term-filter" errors={state.errors?.termIds}>
        <TermPicker
          // エラーで戻ってきたときに選択状態を戻すため、key を変えて作り直す
          key={state.termIds?.join(",") ?? "initial"}
          options={termOptions}
          defaultSelected={state.termIds ?? props.selectedTermIds ?? []}
        />
      </Field>

      <div className="flex gap-3">
        <button type="submit" className={buttonClass.primary} disabled={pending}>
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link href={cancelHref} className={buttonClass.secondary}>
          キャンセル
        </Link>
      </div>
    </form>
  );
}
