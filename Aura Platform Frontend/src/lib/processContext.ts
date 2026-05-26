/** Stable key for step1+step2 — used to cache step3 autofill. */
export function processContextKey(step1: unknown, step2: unknown): string {
  return JSON.stringify({ step1: step1 ?? {}, step2: step2 ?? {} })
}
