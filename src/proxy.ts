import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 "proxy" convention (formerly middleware). Edge-safe: uses only
// authConfig (no adapter / Prisma / bcrypt). The `authorized` callback in
// authConfig gates /studio and /admin.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/studio/:path*"],
};
