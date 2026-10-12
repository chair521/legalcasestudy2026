"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { type FormState, pickFormValues, termFields, termInputSchema } from "@/lib/validation";

export type TermFormState = FormState<(typeof termFields)[number]>;

function parse(formData: FormData) {
  const values = pickFormValues(formData, termFields);
  return { values, result: termInputSchema.safeParse(values) };
}

export async function createTerm(_prev: TermFormState, formData: FormData): Promise<TermFormState> {
  const { values, result } = parse(formData);
  if (!result.success) {
    return { values, errors: z.flattenError(result.error).fieldErrors };
  }

  await db.insert(terms).values(result.data);

  revalidatePath("/terms");
  redirect("/terms");
}

export async function updateTerm(id: number, _prev: TermFormState, formData: FormData): Promise<TermFormState> {
  const { values, result } = parse(formData);
  if (!result.success) {
    return { values, errors: z.flattenError(result.error).fieldErrors };
  }

  const updated = await db.update(terms).set(result.data).where(eq(terms.id, id)).returning({ id: terms.id });
  if (updated.length === 0) {
    return { values, message: "用語が見つかりませんでした（削除された可能性があります）" };
  }

  revalidatePath("/terms");
  redirect("/terms");
}

export async function deleteTerm(id: number) {
  await db.delete(terms).where(eq(terms.id, id));
  revalidatePath("/terms");
}
