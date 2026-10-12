import { relations } from "drizzle-orm";
import { date, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // 小文字にそろえて保存する
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// ログイン中のセッション。トークンそのものではなく SHA-256 ハッシュを id として保存する
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

// ユーザーが削除されたら、そのユーザーのデータもまとめて消す
const ownerId = () =>
  integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

// 用語集（日本語 ⇔ 中国語）
export const terms = pgTable(
  "terms",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: ownerId(),
    japanese: text("japanese").notNull(),
    chinese: text("chinese").notNull(),
    // 読みはひらがなで保存する（検索時の表記ゆれを減らすため）
    reading: text("reading").notNull().default(""),
    category: text("category").notNull().default(""),
    note: text("note").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("terms_user_id_category_idx").on(t.userId, t.category),
    // 同じユーザーが同じ「日本語＋中国語」を二重に登録しないように（CSV 取り込み時の重複判定にも使う）
    uniqueIndex("terms_user_id_japanese_chinese_idx").on(t.userId, t.japanese, t.chinese),
  ],
);

// 対応記録：どの手続きで、どこで詰まり、どう説明したか
export const records = pgTable(
  "records",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: ownerId(),
    title: text("title").notNull(),
    occurredOn: date("occurred_on").notNull(),
    procedure: text("procedure").notNull().default(""), // 手続きの種類（例：在留期間更新）
    situation: text("situation").notNull().default(""), // 状況・背景
    issue: text("issue").notNull(), // どこで詰まったか
    explanation: text("explanation").notNull(), // どう説明したか
    improvement: text("improvement").notNull().default(""), // 次回への改善
    ...timestamps,
  },
  (t) => [index("records_user_id_occurred_on_idx").on(t.userId, t.occurredOn)],
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
