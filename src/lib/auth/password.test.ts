import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("正しいパスワードだけを受け付ける", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("同じパスワードでもソルトによって毎回違うハッシュになる", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });

  it("不正な形式のハッシュは false", async () => {
    expect(await verifyPassword("x", "plain-text")).toBe(false);
  });
});
