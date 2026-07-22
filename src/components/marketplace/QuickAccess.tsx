import Link from "next/link";
import {
  QrCode,
  Tag,
  Truck,
  Star,
  Newspaper,
  Wallet,
  Gift,
  LayoutGrid,
} from "lucide-react";

const QUICK_ITEMS = [
  { icon: QrCode,      label: "Scan QRIS",     href: "/scan" },
  { icon: Tag,         label: "Kupon Saya",    href: "/kupon" },
  { icon: Truck,       label: "Lacak Paket",   href: "/lacak-pesanan" },
  { icon: Star,        label: "Wishlist",       href: "/wishlist" },
  { icon: Newspaper,   label: "Ruang Budaya",  href: "/ruang-budaya" },
  { icon: Wallet,      label: "Dompetku",      href: "/akun/dompet" },
  { icon: Gift,        label: "Hadiah",         href: "/hadiah" },
  { icon: LayoutGrid,  label: "Semua Menu",    href: "/menu" },
];

export default function QuickAccess() {
  return (
    <section className="md:hidden px-4 pt-3 pb-1 bg-background">
      <div className="grid grid-cols-4 gap-1">
        {QUICK_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-amber-900/10 transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-800/30 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] text-center text-muted-foreground leading-tight font-medium">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
