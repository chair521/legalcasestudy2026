import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { todayInJapan } from "@/lib/validation";
import { createRecord } from "../actions";
import { getProcedures, getTermOptions } from "../queries";
import { RecordForm } from "../RecordForm";

export default async function NewRecordPage() {
  await connection();
  const [termOptions, procedures] = await Promise.all([getTermOptions(), getProcedures()]);

  return (
    <>
      <PageHeader title="対応記録を追加" />
      <RecordForm
        action={createRecord}
        termOptions={termOptions}
        procedures={procedures}
        defaultDate={todayInJapan()}
        submitLabel="追加する"
        cancelHref="/records"
      />
    </>
  );
}
