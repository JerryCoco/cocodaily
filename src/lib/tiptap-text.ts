/** Flatten a Tiptap/ProseMirror doc to plain text — for search indexing and
 *  reading-time estimates. */
export function tiptapToPlainText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
    // treat block boundaries as spaces
    if (n.type && n.type !== "text") parts.push(" ");
  };
  walk(doc);
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function readingTimeMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
