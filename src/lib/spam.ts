/** Lightweight, dependency-free heuristics for comment spam. Not bulletproof —
 *  the point is to keep the obvious junk out of the moderation queue. */
export type SpamVerdict = "spam" | "suspect" | "clean";

const BANNED =
  /\b(viagra|cialis|casino|forex|crypto\s?giveaway|free\s?money|loan\s?offer|xxx|porn|escort|betting\s?tips)\b/i;

export function scoreComment(raw: string): SpamVerdict {
  const body = raw.trim();
  const links = (body.match(/https?:\/\/|www\./gi) ?? []).length;
  const letters = body.replace(/[^A-Za-z]/g, "");
  const capsRatio = letters.length
    ? (letters.match(/[A-Z]/g) ?? []).length / letters.length
    : 0;
  const longRepeat = /(.)\1{9,}/.test(body); // "aaaaaaaaaa"

  if (BANNED.test(body) || links >= 3) return "spam";
  if (links === 2) return "suspect";
  if (body.length > 40 && capsRatio > 0.7) return "suspect";
  if (longRepeat) return "suspect";
  return "clean";
}
