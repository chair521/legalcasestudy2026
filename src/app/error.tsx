"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-xl font-bold">エラーが発生しました</h1>
      <p className="mb-6 text-slate-500">時間をおいて、もう一度お試しください。</p>
      <button type="button" onClick={reset} className={buttonClass.primary}>
        再読み込み
      </button>
    </div>
  );
}
