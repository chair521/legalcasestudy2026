"use client";

import { useActionState } from "react";
import { Alert, buttonClass, Field, inputClass } from "@/components/ui";
import type { AuthFormState } from "./actions";

type Props = {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  passwordHint?: string;
  isSignup?: boolean;
};

export function AuthForm({ action, submitLabel, passwordHint, isSignup }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.message && <Alert>{state.message}</Alert>}
      <Field label="メールアドレス" htmlFor="email" errors={state.errors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          className={inputClass}
          required
        />
      </Field>
      <Field label="パスワード" htmlFor="password" hint={passwordHint} errors={state.errors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          className={inputClass}
          required
        />
      </Field>
      <button type="submit" className={`${buttonClass.primary} w-full`} disabled={pending}>
        {pending ? "送信中…" : submitLabel}
      </button>
    </form>
  );
}
