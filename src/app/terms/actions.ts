"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { type FormState, pickFormValues, termFields, termInputSchema } from "@/lib/validation";

export type TermFormState = FormState<(typeof termFields)[number]>;

function parse(formData: FormData) {
  const values = pickFormValues(formData, termFields);
  return { values, result: termInputSchema.safeParse(values) };
}

export async function createTerm(_prev: TermFormState, formData: FormData): Promise<TermFormState> {
  const user = await requireUser();
  const { values, result } = parse(formData);
  if (!result.success) {
    return { values, errors: z.flattenError(result.error).fieldErrors };
  }

  await db.insert(terms).values({ ...result.data, userId: user.id });

  revalidatePath("/terms");
  redirect("/terms");
}

export async function updateTerm(id: number, _prev: TermFormState, formData: FormData): Promise<TermFormState> {
  const user = await requireUser();
  const { values, result } = parse(formData);
  if (!result.success) {
    return { values, errors: z.flattenError(result.error).fieldErrors };
  }

  // 条件に user_id を必ず含め、他のユーザーの用語は更新できないようにする
  const updated = await db
    .update(terms)
    .set(result.data)
    .where(and(eq(terms.id, id), eq(terms.userId, user.id)))
    .returning({ id: terms.id });
  if (updated.length === 0) {
    return { values, message: "用語が見つかりませんでした（削除された可能性があります）" };
  }

  revalidatePath("/terms");
  redirect("/terms");
}

export async function deleteTerm(id: number) {
  const user = await requireUser();
  await db.delete(terms).where(and(eq(terms.id, id), eq(terms.userId, user.id)));
  revalidatePath("/terms");
}
