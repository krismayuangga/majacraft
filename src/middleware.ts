import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js App Router middleware — NextAuth v5 split config pattern
// auth.config.ts tidak menggunakan Prisma, aman di Edge runtime
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/akun/:path*", "/keranjang/:path*", "/checkout/:path*",
    "/pesanan/:path*", "/chat/:path*", "/wishlist/:path*",
    "/studio/:path*", "/admin/:path*",
    "/masuk", "/daftar",
  ],
};
