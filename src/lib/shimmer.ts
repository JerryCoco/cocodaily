/**
 * Tiny inline SVG used as `blurDataURL` for next/image, so cover images fade in
 * from a soft shimmer instead of popping. Matches the .img-skeleton palette.
 */
const svg = `<svg width="16" height="10" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#edeae6" offset="20%"/><stop stop-color="#f4f2ef" offset="50%"/><stop stop-color="#edeae6" offset="80%"/></linearGradient></defs><rect width="16" height="10" fill="url(#g)"/></svg>`;

const toB64 =
  typeof window === "undefined"
    ? (s: string) => Buffer.from(s).toString("base64")
    : (s: string) => window.btoa(s);

export const shimmerDataURL = `data:image/svg+xml;base64,${toB64(svg)}`;
