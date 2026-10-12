"use client";

import { useTransition } from "react";
import { buttonClass } from "./ui";

/** 確認ダイアログを出してから削除用の Server Action を呼ぶボタン */
export function DeleteButton({ action, confirmMessage }: { action: () => Promise<void>; confirmMessage: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={buttonClass.danger}
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(() => action());
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}
