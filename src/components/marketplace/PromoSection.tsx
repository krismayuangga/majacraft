import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Award, Store, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock — nanti diganti dengan session auth asli
const MOCK_USER = {
  isLoggedIn: true,
  role: "buyer", // "buyer" | "seller"
};

const PERKS = [
  { icon: ShieldCheck, title: "Sertifikat Phygital", desc: "Setiap karya dilengkapi Sertifikat Phygital — identitas digital yang terdaftar permanen" },
  { icon: Truck, title: "Pengiriman Aman", desc: "Dikemas khusus untuk perlindungan karya seni" },
  { icon: RotateCcw, title: "Jaminan Pengembalian", desc: "30 hari pengembalian jika karya tidak sesuai" },
  { icon: Award, title: "Seniman Terverifikasi", desc: "Semua penjual melewati kurasi tim MAJA" },
];

export default function PromoSection() {
  const isSeller = MOCK_USER.isLoggedIn && MOCK_USER.role === "seller";

  return (
    <>
      {/* Perks Bar */}
      <section className="bg-[#1C1A14] border-y border-amber-900/30 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PERKS.map((perk) => (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-900/30 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
                  <perk.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-200">{perk.title}</p>
                  <p className="text-xs text-amber-600 mt-0.5 leading-snug">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Banner — kondisional berdasarkan role */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-[#1C1A14] to-amber-950 border border-amber-800/30 p-8 md:p-12">
          <div className="absolute inset-0 bg-batik-overlay opacity-20" />
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-900/20 to-transparent" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-900/40 border border-amber-600/30 flex items-center justify-center">
                {isSeller ? (
                  <LayoutDashboard className="w-8 h-8 text-amber-400" />
                ) : (
                  <Store className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div>
                {isSeller ? (
                  <>
                    <h3 className="text-2xl font-bold text-amber-100">Studio Seniman Anda</h3>
                    <p className="text-amber-400/70 mt-1">Kelola karya, pantau pesanan, dan lihat statistik toko</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-amber-600">
                      <span>✓ Toko aktif</span>
                      <span>✓ 12 karya terdaftar</span>
                      <span>✓ 4 pesanan aktif</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-amber-100">Buka Studio Seniman</h3>
                    <p className="text-amber-400/70 mt-1">Daftarkan karya Anda dan jangkau kolektor di seluruh Indonesia</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-amber-600">
                      <span>✓ Gratis daftar</span>
                      <span>✓ Sertifikat otomatis</span>
                      <span>✓ Jangkauan nasional</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/studio"
              className="btn-gold inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-sm flex-shrink-0"
            >
              {isSeller ? "Kelola Studio" : "Mulai Berjualan"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
