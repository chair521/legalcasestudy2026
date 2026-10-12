import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { termsToCsv } from "@/lib/csv";
import { todayInJapan } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("ログインが必要です", { status: 401 });

  const rows = await db
    .select({
      japanese: terms.japanese,
      chinese: terms.chinese,
      reading: terms.reading,
      category: terms.category,
      note: terms.note,
    })
    .from(terms)
    .where(eq(terms.userId, user.id))
    .orderBy(asc(terms.category), asc(terms.reading), asc(terms.japanese));

  return new Response(termsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="terms-${todayInJapan()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
