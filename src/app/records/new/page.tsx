import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { todayInJapan } from "@/lib/validation";
import { createRecord } from "../actions";
import { getProcedures, getTermOptions } from "../queries";
import { RecordForm } from "../RecordForm";

export default async function NewRecordPage() {
  const user = await requireUser();
  const [termOptions, procedures] = await Promise.all([getTermOptions(user.id), getProcedures(user.id)]);

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
