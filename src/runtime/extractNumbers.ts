const ADD_FILLERS = new Set([
  "add",
  "plus",
  "sum",
  "and",
  "the",
  "a",
  "an",
  "to",
  "with",
]);

const WORD_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

function parseAddendToken(token: string): number | undefined {
  if (/^\d+$/.test(token)) return Number(token);
  const word = WORD_NUMBER[token];
  if (word !== undefined) return word;
  return undefined;
}

/**
 * Pull the first two integer runs from the prompt (order-preserving).
 * Used for heuristic tools like core.add.
 */
export function extractNumbers(prompt: string): { a: number; b: number } | null {
  const matches = prompt.match(/\d+/g);
  if (!matches || matches.length < 2) return null;

  return {
    a: Number(matches[0]),
    b: Number(matches[1]),
  };
}

export type PartialAddArgs = {
  a: number | string;
  b: number | string;
};

/**
 * Best-effort operands for core.add: exact digit runs first, then scan for
 * digit tokens and spelled small cardinals. Last resort: first two non-filler
 * tokens (kernel may still reject).
 */
export function extractPartial(prompt: string): PartialAddArgs {
  const exact = extractNumbers(prompt);
  if (exact) return exact;

  const tokens = prompt
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .filter((t) => !ADD_FILLERS.has(t));

  const found: number[] = [];
  for (const t of tokens) {
    const n = parseAddendToken(t);
    if (n !== undefined) {
      found.push(n);
      if (found.length >= 2) {
        return { a: found[0], b: found[1] };
      }
    }
  }

  const a = tokens[0] ?? "";
  const b = tokens[1] ?? "";
  return { a, b };
}

/** Used by intent augmentation: two resolvable numeric addends (digits or words). */
export function hasTwoResolvableAddends(prompt: string): boolean {
  const p = extractPartial(prompt);
  return typeof p.a === "number" && typeof p.b === "number";
}
