import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { createTerm } from "../actions";
import { getCategories } from "../queries";
import { TermForm } from "../TermForm";

export default async function NewTermPage() {
  // DB の内容はリクエストごとに変わるので、ビルド時に静的生成させない
  await connection();
  const categories = await getCategories();
  return (
    <>
      <PageHeader title="用語を追加" />
      <TermForm action={createTerm} categories={categories} submitLabel="追加する" />
    </>
  );
}
