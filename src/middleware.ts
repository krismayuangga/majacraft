import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js App Router middleware — NextAuth v5 split config pattern
const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth?: unknown }) => {
  const isMobileApp = (req.headers.get("user-agent") ?? "").includes("MajaCraftApp");
  const isAuthenticated = !!(req as any).auth;

  // Jika mobile app akses halaman protected tanpa session,
  // redirect ke home dengan param ?needsLogin=1 agar native Login terbuka
  if (isMobileApp && !isAuthenticated) {
    const redirect = req.nextUrl.pathname + req.nextUrl.search;
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("needsLogin", "1");
    homeUrl.searchParams.set("redirect", redirect);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/akun/:path*", "/keranjang/:path*", "/checkout/:path*",
    "/pesanan/:path*", "/chat/:path*", "/wishlist/:path*",
    "/studio/:path*", "/admin/:path*",
    "/masuk", "/daftar",
  ],
};
