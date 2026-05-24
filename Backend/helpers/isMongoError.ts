
export function isMongoError(e: unknown, code: number): boolean {
  return typeof e === "object" && e !== null && (e as any).code === code;
}