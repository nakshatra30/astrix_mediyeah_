/**
 * Procedural cover art — deterministic gradients derived from a seed string.
 * Used wherever a project/testimonial has no uploaded image so the site never
 * shows broken media, while staying on-brand with the Astrix aurora palette.
 */

const PAIRS: Array<[string, string]> = [
  ["#FF3159", "#754CFF"],
  ["#D52BB6", "#168BFF"],
  ["#754CFF", "#FF3159"],
  ["#168BFF", "#D52BB6"],
  ["#FF3159", "#D52BB6"],
  ["#754CFF", "#168BFF"],
];

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function coverPair(seed: string): [string, string] {
  return PAIRS[hashString(seed) % PAIRS.length]!;
}

/** Full CSS background for DOM cover elements. */
export function coverBackground(seed: string): string {
  const [from, to] = coverPair(seed);
  return `radial-gradient(80% 90% at 15% 10%, ${hexAlpha(from, 0.55)}, transparent 60%), radial-gradient(70% 80% at 85% 90%, ${hexAlpha(to, 0.5)}, transparent 60%), linear-gradient(150deg, #14121f, #0b0a14 60%)`;
}

export function hexAlpha(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
