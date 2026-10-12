import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { updateTerm } from "../../actions";
import { getCategories, getTerm } from "../../queries";
import { TermForm } from "../../TermForm";

export default async function EditTermPage(props: PageProps<"/terms/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [term, categories] = await Promise.all([
    getTerm(user.id, id),
    getCategories(user.id),
  ]);
  if (!term) notFound();

  return (
    <>
      <PageHeader title="用語を編集" />
      <TermForm action={updateTerm.bind(null, id)} term={term} categories={categories} submitLabel="保存する" />
    </>
  );
}
