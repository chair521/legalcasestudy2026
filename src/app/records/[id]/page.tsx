import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { deleteRecord } from "../actions";
import { getRecord } from "../queries";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h2 className="text-sm font-bold text-slate-500">{title}</h2>
      <div className="whitespace-pre-wrap text-slate-800">{children}</div>
    </section>
  );
}

export default async function RecordPage(props: PageProps<"/records/[id]">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const record = await getRecord(user.id, id);
  if (!record) notFound();

  return (
    <>
      <Link href="/records" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← 対応記録の一覧へ
      </Link>
      <PageHeader title={record.title}>
        <LinkButton href={`/records/${id}/edit`} variant="secondary">
          編集
        </LinkButton>
        <DeleteButton action={deleteRecord.bind(null, id)} confirmMessage={`「${record.title}」を削除しますか？`} />
      </PageHeader>

      <article className="max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>対応日：{record.occurredOn}</span>
          {record.procedure && <span>手続き：{record.procedure}</span>}
        </div>

        {record.situation && <Section title="状況">{record.situation}</Section>}
        <Section title="どこで詰まったか">{record.issue}</Section>
        <Section title="どう説明したか">{record.explanation}</Section>
        {record.improvement && <Section title="次回への改善">{record.improvement}</Section>}

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500">使った用語</h2>
          {record.recordTerms.length === 0 ? (
            <p className="text-sm text-slate-400">関連づけられた用語はありません</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {record.recordTerms.map(({ term }) => (
                <li key={term.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-medium">{term.japanese}</span>
                  <span lang="zh">{term.chinese}</span>
                  {term.note && <span className="text-slate-500">{term.note}</span>}
                  <Link href={`/terms/${term.id}/edit`} className="ml-auto text-teal-700 hover:underline">
                    用語を編集
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </>
  );
}
