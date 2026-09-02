import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Cover images come from Cloudinary (uploads) and from many different news
    // domains (RSS thumbnails). Next's optimizer resizes + re-encodes and caches
    // them on the CDN regardless of origin.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
