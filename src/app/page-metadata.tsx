import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MajaCraft — Marketplace Kerajinan Seni & Budaya Nusantara Terpercaya",
  description: "MajaCraft marketplace seni Nusantara terpercaya. Belanja kerajinan autentik, batik, wayang, dan karya seni dari seniman lokal terbaik Indonesia. Gratis ongkir & pembayaran aman.",
  openGraph: {
    title: "MajaCraft — Kerajinan Seni Nusantara",
    description: "Temukan karya seni autentik dari seniman lokal Indonesia. Jaminan keaslian, pembayaran aman, gratis ongkir.",
    images: [
      {
        url: "https://majacraft.id/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MajaCraft Marketplace Seni Nusantara",
      },
    ],
  },
};

// ✅ SCHEMA MARKUP — Organization + LocalBusiness + BreadcrumbList
export function HomepageSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "WebSite",
          "name": "MajaCraft",
          "url": "https://majacraft.id",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://majacraft.id/produk?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          },
          "sameAs": [
            "https://instagram.com/majacraft",
            "https://tiktok.com/@majacraft",
            "https://facebook.com/majacraft"
          ]
        }),
      }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Organization",
          "name": "MajaCraft",
          "description": "Marketplace kerajinan seni dan budaya Nusantara terpercaya",
          "url": "https://majacraft.id",
          "logo": "https://majacraft.id/logo.png",
          "email": "hello@majacraft.id",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+62-XXX-XXXX",
            "contactType": "Customer Support"
          },
          "sameAs": [
            "https://instagram.com/majacraft",
            "https://tiktok.com/@majacraft",
            "https://facebook.com/majacraft"
          ],
          "areaServed": "ID",
          "award": "Marketplace Seni Nusantara Terpercaya"
        }),
      }}
    />
  );
}
