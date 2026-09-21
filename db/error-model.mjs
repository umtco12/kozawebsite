export function isUniqueConstraintError(error) {
  if (error && typeof error === "object" && "code" in error && error.code === "23505") return true;
  const message = error instanceof Error ? error.message : String(error || "");
  return /UNIQUE constraint failed|duplicate key value violates unique constraint/i.test(message);
}
