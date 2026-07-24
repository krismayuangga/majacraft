"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// Halaman yang tidak perlu footer di mobile (fokus transaksi / konten penuh)
const MOBILE_HIDDEN = [
  "/produk/",   // detail produk
  "/checkout",
  "/payment",
  "/chat",
  "/studio",
  "/admin",
];

export default function FooterWrapper() {
  const pathname = usePathname();
  const hiddenOnMobile = MOBILE_HIDDEN.some(p => pathname.startsWith(p));

  return (
    <div data-footer className={hiddenOnMobile ? "hidden md:block" : ""}>
      <Footer />
    </div>
  );
}
