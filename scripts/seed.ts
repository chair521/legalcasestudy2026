import "dotenv/config";
import { db } from "../src/db";
import { terms } from "../src/db/schema";
import { sampleTerms } from "./sample-terms";

async function main() {
  await db.delete(terms);
  await db.insert(terms).values(sampleTerms);
  console.log(`用語 ${sampleTerms.length} 件を登録しました`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
