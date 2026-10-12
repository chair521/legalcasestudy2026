import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// 用語集（日本語 ⇔ 中国語）
export const terms = pgTable(
  "terms",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    japanese: text("japanese").notNull(),
    chinese: text("chinese").notNull(),
    // 読みはひらがなで保存する（検索時の表記ゆれを減らすため）
    reading: text("reading").notNull().default(""),
    category: text("category").notNull().default(""),
    note: text("note").notNull().default(""),
    ...timestamps,
  },
  (t) => [index("terms_category_idx").on(t.category)],
);

export type Term = typeof terms.$inferSelect;
