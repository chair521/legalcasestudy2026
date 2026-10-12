import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { records, recordTerms, terms, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { sampleRecords } from "./sample-records";
import { sampleTerms } from "./sample-terms";

// デモ用アカウント（README に記載）。データはすべて架空
export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo-pass-2026";

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await db.transaction(async (tx) => {
    // デモユーザーを作り直す（ON DELETE CASCADE で用語・記録も消える）
    await tx.delete(users).where(eq(users.email, DEMO_EMAIL));
    const [user] = await tx.insert(users).values({ email: DEMO_EMAIL, passwordHash }).returning({ id: users.id });

    const insertedTerms = await tx
      .insert(terms)
      .values(sampleTerms.map((t) => ({ ...t, userId: user.id })))
      .returning({ id: terms.id, japanese: terms.japanese });
    const termIdByName = new Map(insertedTerms.map((t) => [t.japanese, t.id]));

    for (const { terms: termNames, ...record } of sampleRecords) {
      const [created] = await tx
        .insert(records)
        .values({ ...record, userId: user.id })
        .returning({ id: records.id });
      const links = termNames.flatMap((name) => {
        const termId = termIdByName.get(name);
        return termId ? [{ recordId: created.id, termId }] : [];
      });
      if (links.length > 0) await tx.insert(recordTerms).values(links);
    }
  });

  console.log(`デモユーザー ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`用語 ${sampleTerms.length} 件、対応記録 ${sampleRecords.length} 件を登録しました`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
