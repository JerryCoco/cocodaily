import { createHash, randomBytes } from "node:crypto";

/** URL-safe random token to email out. */
export const newToken = () => randomBytes(32).toString("base64url");

/** What we store — a one-way hash, so a DB leak yields no usable links. */
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
