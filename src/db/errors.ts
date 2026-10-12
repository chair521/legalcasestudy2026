/** PostgreSQL の一意制約違反（SQLSTATE 23505）かどうか。Drizzle は元のエラーを cause に入れて投げる */
export function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? e.code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}
