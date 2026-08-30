import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only authConfig (no adapter / Prisma / bcrypt). The
// `authorized` callback in authConfig gates /admin and /studio.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/studio/:path*"],
};
