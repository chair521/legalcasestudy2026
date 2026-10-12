import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { todayInJapan } from "@/lib/validation";
import { updateRecord } from "../../actions";
import { getProcedures, getRecord, getTermOptions } from "../../queries";
import { RecordForm } from "../../RecordForm";

export default async function EditRecordPage(props: PageProps<"/records/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [record, termOptions, procedures] = await Promise.all([
    getRecord(user.id, id),
    getTermOptions(user.id),
    getProcedures(user.id),
  ]);
  if (!record) notFound();

  return (
    <>
      <PageHeader title="対応記録を編集" />
      <RecordForm
        action={updateRecord.bind(null, id)}
        record={record}
        selectedTermIds={record.recordTerms.map((rt) => rt.termId)}
        termOptions={termOptions}
        procedures={procedures}
        defaultDate={todayInJapan()}
        submitLabel="保存する"
        cancelHref={`/records/${id}`}
      />
    </>
  );
}
