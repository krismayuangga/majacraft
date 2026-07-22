"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, ShoppingCart, ClipboardList, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch("/api/cart", { credentials: "include" })
      .then(r => r.json())
      .then(d => setCartCount(d.data?.items?.length ?? 0))
      .catch(() => {});
  }, [pathname]); // refetch saat navigasi

  const NAV_ITEMS = [
    { href: "/",          icon: Home,          label: "Beranda",   badge: 0 },
    { href: "/produk",    icon: Search,        label: "Cari",      badge: 0 },
    { href: "/keranjang", icon: ShoppingCart,  label: "Keranjang", badge: cartCount },
    { href: "/pesanan",   icon: ClipboardList, label: "Pesanan",   badge: 0 },
    { href: "/akun",      icon: User,          label: "Akun",      badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1C1A14] border-t border-amber-900/40 safe-area-pb">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isCart = item.label === "Keranjang";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                isActive ? "text-amber-400" : "text-amber-700 hover:text-amber-500"
              }`}
            >
              {/* Active top bar */}
              {isActive && !isCart && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full" />
              )}

              {/* Cart — elevated center button */}
              {isCart ? (
                <div className={`relative -mt-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                  isActive
                    ? "bg-amber-500 border-amber-400 shadow-amber-900/60"
                    : "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500/50 shadow-amber-900/40"
                }`}>
                  <item.icon className="w-5 h-5 text-[#1C1A14]" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                </div>
              )}

              <span className={`text-[10px] font-medium leading-none ${isCart ? "mt-1" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
