import { relations } from "drizzle-orm";
import { date, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

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

// 対応記録：どの手続きで、どこで詰まり、どう説明したか
export const records = pgTable(
  "records",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    occurredOn: date("occurred_on").notNull(),
    procedure: text("procedure").notNull().default(""), // 手続きの種類（例：在留期間更新）
    situation: text("situation").notNull().default(""), // 状況・背景
    issue: text("issue").notNull(), // どこで詰まったか
    explanation: text("explanation").notNull(), // どう説明したか
    improvement: text("improvement").notNull().default(""), // 次回への改善
    ...timestamps,
  },
  (t) => [index("records_occurred_on_idx").on(t.occurredOn)],
);

// 対応記録 ⇔ 用語 の多対多。どちらかが削除されたら関連も消える
export const recordTerms = pgTable(
  "record_terms",
  {
    recordId: integer("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    termId: integer("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.recordId, t.termId] }), index("record_terms_term_id_idx").on(t.termId)],
);

export const termsRelations = relations(terms, ({ many }) => ({
  recordTerms: many(recordTerms),
}));

export const recordsRelations = relations(records, ({ many }) => ({
  recordTerms: many(recordTerms),
}));

export const recordTermsRelations = relations(recordTerms, ({ one }) => ({
  record: one(records, { fields: [recordTerms.recordId], references: [records.id] }),
  term: one(terms, { fields: [recordTerms.termId], references: [terms.id] }),
}));

export type Term = typeof terms.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
