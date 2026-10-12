import { afterEach, describe, expect, it } from "vitest";
import { getDatabaseUrl } from "./url";

const original = process.env.DATABASE_URL;
afterEach(() => {
  process.env.DATABASE_URL = original;
});

describe("getDatabaseUrl", () => {
  it("Neon の接続文字列から channel_binding だけを取り除く", () => {
    process.env.DATABASE_URL =
      "postgresql://user:pw@ep-x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    expect(getDatabaseUrl()).toBe("postgresql://user:pw@ep-x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require");
  });

  it("未設定ならエラー", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL");
  });
});
