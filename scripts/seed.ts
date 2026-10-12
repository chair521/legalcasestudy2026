import "dotenv/config";
import { db } from "../src/db";
import { records, recordTerms, terms } from "../src/db/schema";
import { sampleRecords } from "./sample-records";
import { sampleTerms } from "./sample-terms";

async function main() {
  await db.transaction(async (tx) => {
    await tx.delete(records);
    await tx.delete(terms);

    const insertedTerms = await tx.insert(terms).values(sampleTerms).returning({ id: terms.id, japanese: terms.japanese });
    const termIdByName = new Map(insertedTerms.map((t) => [t.japanese, t.id]));

    for (const { terms: termNames, ...record } of sampleRecords) {
      const [created] = await tx.insert(records).values(record).returning({ id: records.id });
      const links = termNames.flatMap((name) => {
        const termId = termIdByName.get(name);
        return termId ? [{ recordId: created.id, termId }] : [];
      });
      if (links.length > 0) await tx.insert(recordTerms).values(links);
    }
  });
  console.log(`用語 ${sampleTerms.length} 件、対応記録 ${sampleRecords.length} 件を登録しました`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
