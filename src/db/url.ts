/**
 * 環境変数 DATABASE_URL を読み、postgres.js が扱えない指定を取り除く。
 * Neon の接続文字列に付く channel_binding は、postgres.js だと DB への接続パラメーターとして
 * そのまま送られてしまい、接続エラーになるため削除する。
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL が設定されていません（.env.example を参照）");
  }
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}
