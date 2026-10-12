import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { createTerm } from "../actions";
import { getCategories } from "../queries";
import { TermForm } from "../TermForm";

export default async function NewTermPage() {
  const user = await requireUser();
  const categories = await getCategories(user.id);
  return (
    <>
      <PageHeader title="用語を追加" />
      <TermForm action={createTerm} categories={categories} submitLabel="追加する" />
    </>
  );
}
