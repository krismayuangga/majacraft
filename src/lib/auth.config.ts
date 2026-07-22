import type { NextAuthConfig } from "next-auth";

// Konfigurasi ringan untuk Edge runtime (middleware)
// TANPA Prisma adapter — aman di Edge
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/masuk",
    error: "/masuk",
  },
  session: { strategy: "jwt" },
  providers: [], // providers ditambahkan di auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const PROTECTED  = ["/akun", "/keranjang", "/checkout", "/pesanan", "/chat", "/wishlist", "/studio", "/admin"];
      const SELLER_ONLY = [] as string[]; // Cek dilakukan di dalam halaman Studio
      const ADMIN_ONLY  = [] as string[]; // Cek dilakukan di dalam halaman Admin
      const AUTH_PAGES  = ["/masuk", "/daftar"];

      const needsAuth   = PROTECTED.some((r) => pathname.startsWith(r));
      const needsSeller = SELLER_ONLY.some((r) => pathname.startsWith(r));
      const needsAdmin  = ADMIN_ONLY.some((r) => pathname.startsWith(r));
      const isAuthPage  = AUTH_PAGES.includes(pathname);

      // Redirect ke login jika belum auth
      if ((needsAuth || needsSeller || needsAdmin) && !isLoggedIn) {
        const url = new URL("/masuk", nextUrl);
        url.searchParams.set("callbackUrl", pathname);
        return Response.redirect(url);
      }

      const role = (auth?.user as { role?: string } | undefined)?.role;

      // Seller check
      if (needsSeller && role !== "SELLER" && role !== "ADMIN") {
        return Response.redirect(new URL("/daftar", nextUrl));
      }

      // Admin check
      if (needsAdmin && role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Redirect dari auth pages jika sudah login
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
};
