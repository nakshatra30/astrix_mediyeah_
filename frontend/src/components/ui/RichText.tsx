/**
 * Renders backend rich text. The API sanitizes these fields server-side
 * (allowlisted tags, stripped attributes) before storage, so they are safe
 * to inject after transport over TLS from our own API.
 */
export function RichText({ html, className = "" }: { html: string | null | undefined; className?: string }) {
  if (html === null || html === undefined || html.trim() === "") return null;
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
