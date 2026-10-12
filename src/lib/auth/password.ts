import { randomBytes, scrypt, type ScryptOptions, timingSafeEqual } from "node:crypto";

// scrypt は Node.js 標準のパスワードハッシュ関数。外部ライブラリなしで「遅いハッシュ＋ソルト」を実現できる
const KEY_LENGTH = 64;
const OPTIONS: ScryptOptions = { N: 16384, r: 8, p: 1 };

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, OPTIONS, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** 保存形式: scrypt$<salt(base64)>$<hash(base64)> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltB64, keyB64] = stored.split("$");
  if (algorithm !== "scrypt" || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"));
  // 比較にかかる時間から一致した文字数を推測されないよう、定数時間で比較する
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
