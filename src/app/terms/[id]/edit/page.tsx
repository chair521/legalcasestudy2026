import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { updateTerm } from "../../actions";
import { getCategories } from "../../queries";
import { TermForm } from "../../TermForm";

export default async function EditTermPage(props: PageProps<"/terms/[id]/edit">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [term, categories] = await Promise.all([
    db.query.terms.findFirst({ where: eq(terms.id, id) }),
    getCategories(),
  ]);
  if (!term) notFound();

  return (
    <>
      <PageHeader title="用語を編集" />
      <TermForm action={updateTerm.bind(null, id)} term={term} categories={categories} submitLabel="保存する" />
    </>
  );
}
