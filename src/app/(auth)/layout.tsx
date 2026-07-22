import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MajaCraft",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F0E0A] flex flex-col">
      {/* Content — logo di tengah atas panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Logo di tengah */}
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Image
                src="/images/new-logo-majacraft.png"
                alt="MajaCraft"
                width={200}
                height={46}
                className="object-contain h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
          </div>

          {children}

          {/* Ornament bawah */}
          <div className="flex justify-center mt-6">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <footer className="px-6 py-4 border-t border-amber-900/20 text-center text-xs text-amber-800">
        © 2025 MajaCraft ·{" "}
        <Link href="/privasi" className="hover:text-amber-600">Privasi</Link>
        {" · "}
        <Link href="/syarat" className="hover:text-amber-600">Syarat & Ketentuan</Link>
      </footer>
    </div>
  );
}
