/** Deterministic, JSON-like string for comparison: sorted object keys, array order preserved, cycles → [Circular]. */
export function stableStringify(value: unknown): string {
  const visiting = new WeakSet<object>();

  function inner(val: unknown): string {
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (typeof val !== "object") return JSON.stringify(val);
    if (visiting.has(val)) return '"[Circular]"';
    visiting.add(val);
    try {
      if (Array.isArray(val)) {
        return `[${val.map((item) => inner(item)).join(",")}]`;
      }
      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${inner(obj[k])}`).join(",")}}`;
    } finally {
      visiting.delete(val);
    }
  }

  return inner(value);
}
