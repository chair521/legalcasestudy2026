"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { records, recordTerms, terms } from "@/db/schema";
import { type FormState, pickFormValues, recordFields, recordInputSchema } from "@/lib/validation";

export type RecordFormState = FormState<(typeof recordFields)[number] | "termIds"> & { termIds?: number[] };

function parse(formData: FormData) {
  const values = pickFormValues(formData, recordFields);
  const termIds = formData.getAll("termIds").map(Number);
  return { values, termIds, result: recordInputSchema.safeParse({ ...values, termIds }) };
}

/** 存在する用語 ID だけに絞る（改ざんされたリクエストで他人の用語などを紐づけられないように） */
async function existingTermIds(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const rows = await db.select({ id: terms.id }).from(terms).where(inArray(terms.id, [...new Set(ids)]));
  return rows.map((r) => r.id);
}

export async function createRecord(_prev: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const { values, termIds, result } = parse(formData);
  if (!result.success) {
    return { values, termIds, errors: z.flattenError(result.error).fieldErrors };
  }
  const { termIds: requestedIds, ...data } = result.data;
  const validIds = await existingTermIds(requestedIds);

  const id = await db.transaction(async (tx) => {
    const [created] = await tx.insert(records).values(data).returning({ id: records.id });
    if (validIds.length > 0) {
      await tx.insert(recordTerms).values(validIds.map((termId) => ({ recordId: created.id, termId })));
    }
    return created.id;
  });

  revalidatePath("/records");
  redirect(`/records/${id}`);
}

export async function updateRecord(id: number, _prev: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const { values, termIds, result } = parse(formData);
  if (!result.success) {
    return { values, termIds, errors: z.flattenError(result.error).fieldErrors };
  }
  const { termIds: requestedIds, ...data } = result.data;
  const validIds = await existingTermIds(requestedIds);

  const found = await db.transaction(async (tx) => {
    const updated = await tx.update(records).set(data).where(eq(records.id, id)).returning({ id: records.id });
    if (updated.length === 0) return false;
    // 関連する用語は「全部消して入れ直す」。件数が少ないので差分計算より単純さを優先
    await tx.delete(recordTerms).where(eq(recordTerms.recordId, id));
    if (validIds.length > 0) {
      await tx.insert(recordTerms).values(validIds.map((termId) => ({ recordId: id, termId })));
    }
    return true;
  });
  if (!found) {
    return { values, termIds, message: "記録が見つかりませんでした（削除された可能性があります）" };
  }

  revalidatePath("/records");
  redirect(`/records/${id}`);
}

export async function deleteRecord(id: number) {
  await db.delete(records).where(eq(records.id, id));
  revalidatePath("/records");
  redirect("/records");
}
