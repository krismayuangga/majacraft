"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, ChevronDown, MapPin, MessageCircle,
  ShoppingBag, Store, LayoutDashboard, LogOut, User,
} from "lucide-react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const isLoggedIn = status === "authenticated";
  const user = session?.user;

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications?limit=1", { credentials: "include" });
        const data = await res.json();
        setUnreadCount(data.data?.unreadCount ?? 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll setiap 30 detik
    return () => clearInterval(interval);
  }, [isLoggedIn]);
  const role = (user as { role?: string } | undefined)?.role ?? "BUYER";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/produk?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar — desktop only */}
      <div className="hidden md:block bg-[#1C1A14] text-xs text-amber-400/70 border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Kirim ke seluruh Indonesia
            </span>
            <span className="hidden md:inline">|</span>
            <Link href="/studio" className="hidden md:inline hover:text-amber-300 transition-colors">
              Buka Toko
            </Link>
            <Link href="/ruang-budaya" className="hidden md:inline hover:text-amber-300 transition-colors">
              Ruang Budaya
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/bantuan" className="hover:text-amber-300 transition-colors">Bantuan</Link>
            <Link href="/lacak-pesanan" className="hover:text-amber-300 transition-colors">Lacak Pesanan</Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="bg-[#1C1A14] border-b border-amber-900/40 shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {/* Full logo desktop */}
            <Image
              src="/images/new-logo-majacraft.png"
              alt="MajaCraft"
              width={220}
              height={68}
              className="hidden sm:block object-contain h-16 w-auto"
              priority
            />
            {/* Icon only mobile */}
            <Image
              src="/images/favicon-maja-craft.png"
              alt="MajaCraft"
              width={44}
              height={44}
              className="sm:hidden object-contain h-10 w-10"
              priority
            />
          </Link>



          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 relative max-w-2xl">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kerajinan, batik, ukiran..."
              className="bg-[#2A2620] border-amber-900/40 text-amber-100 placeholder:text-amber-700 focus:border-amber-500 pr-12 h-10"
            />
            <Button type="submit" size="icon" className="absolute right-0 top-0 h-10 w-10 rounded-l-none btn-gold">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Chat */}
            {isLoggedIn && (
              <Link
                href="/chat"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 relative")}
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            )}

            {/* Notifikasi */}
            {isLoggedIn && (
              <Link href="/akun/notifikasi" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 relative")}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-amber-300 hover:bg-amber-900/30 px-2 py-1.5 rounded-lg transition-colors">
                  <Avatar className="w-7 h-7 border border-amber-600/40">
                    <AvatarImage src={user?.image ?? ""} />
                    <AvatarFallback className="bg-amber-800 text-amber-100 text-xs">
                      {user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown className="w-3 h-3 hidden md:inline" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 bg-[#1C1A14] border-amber-900/50 text-amber-100" align="end">
                  <div className="px-3 py-2 border-b border-amber-900/30">
                    <p className="text-sm font-semibold text-amber-300">{user?.name}</p>
                    <p className="text-xs text-amber-600">
                      {role === "SELLER" ? "Seniman" : role === "ADMIN" ? "Admin" : "Pembeli"}
                    </p>
                  </div>
                  <DropdownMenuItem render={<Link href="/akun" />} className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" /> Akun Saya
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/pesanan" />} className="flex items-center gap-2 cursor-pointer">
                    <ShoppingBag className="w-4 h-4" /> Pesanan Saya
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-amber-900/30" />
                  {(role === "SELLER" || role === "ADMIN") && (
                    <DropdownMenuItem render={<Link href="/studio" />} className="flex items-center gap-2 cursor-pointer">
                      <Store className="w-4 h-4" /> Studio Seniman
                    </DropdownMenuItem>
                  )}
                  {role === "ADMIN" && (
                    <DropdownMenuItem render={<Link href="/admin" />} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-amber-900/30" />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-400 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2" data-auth-buttons>
                <Link href="/masuk" className={cn(buttonVariants({ variant: "ghost" }), "text-amber-300 hover:text-amber-100 text-sm")}>
                  Masuk
                </Link>
                <Link href="/daftar" className={cn(buttonVariants(), "btn-gold text-sm h-9 px-4")}>
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
