import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FooterWrapper from "@/components/layout/FooterWrapper";
import BottomNav from "@/components/layout/BottomNav";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://majacraft.id"),
  title: "MajaCraft — Marketplace Kerajinan Seni & Budaya Nusantara Terpercaya",
  description: "MajaCraft marketplace seni Nusantara terpercaya. Belanja kerajinan, batik, wayang, dan karya seni autentik dari seniman lokal terbaik Indonesia. Gratis ongkir & verified sellers.",
  keywords: [
    "marketplace seni Indonesia",
    "kerajinan Nusantara",
    "batik asli",
    "wayang",
    "karya seni lokal",
    "seniman Indonesia",
    "jual beli kerajinan",
    "seni budaya Indonesia",
    "produk UKM seni",
    "kerajinan tangan Indonesia",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/images/favicon-maja-craft.png",
  },
  openGraph: {
    title: "MajaCraft — Marketplace Seni Nusantara",
    description: "Temukan karya seni autentik dari seniman lokal Indonesia. Jaminan keaslian, pembayaran aman, gratis ongkir.",
    url: "https://majacraft.id",
    siteName: "MajaCraft",
    type: "website",
    images: [
      {
        url: "https://majacraft.id/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MajaCraft Marketplace Seni Nusantara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MajaCraft — Kerajinan Seni Nusantara",
    description: "Marketplace terpercaya untuk karya seni dan budaya Indonesia",
    images: ["https://majacraft.id/og-image.jpg"],
  },
  alternates: {
    canonical: "https://majacraft.id",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <FooterWrapper />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
