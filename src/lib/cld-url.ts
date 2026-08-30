const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Build a Cloudinary delivery URL with transforms. Pass the stored `publicId`.
 * Falls back to the given `fallbackUrl` (a pasted URL, or non-Cloudinary image).
 */
export function cldUrl(
  publicId: string | null | undefined,
  opts: { w?: number; h?: number; fallbackUrl?: string | null } = {},
): string {
  if (!publicId || !CLOUD) return opts.fallbackUrl ?? "";
  const t = ["f_auto", "q_auto", "c_fill", "g_auto"];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.h) t.push(`h_${opts.h}`);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join(",")}/${publicId}`;
}
