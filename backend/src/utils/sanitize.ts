import sanitizeHtml from "sanitize-html";

/**
 * Strips C0/C1 control characters from any user-supplied string before it is
 * stored or echoed back (prevents control-char injection into logs and DB).
 */
export function stripControlChars(input: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional control-char strip
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function clean(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const value = stripControlChars(input);
  return value === "" ? null : value;
}

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "blockquote"],
  allowedAttributes: { a: ["href", "title", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  disallowedTagsMode: "discard",
};

/** Sanitizes rich-text fields (HTML allowlist) — stored XSS defense. */
export function sanitizeRichText(input: string | null | undefined): string | null {
  const value = clean(input);
  if (value === null) return null;
  return sanitizeHtml(value, RICH_TEXT_OPTIONS);
}

/** Sanitizes plain-text fields — control chars only, HTML untouched by contract. */
export function sanitizePlainText(input: string | null | undefined): string | null {
  return clean(input);
}
