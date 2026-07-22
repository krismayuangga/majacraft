import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/produk',
          '/kategori',
          '/toko',
          '/ruang-budaya',
          '/program-seniman',
          '/tentang',
          '/kontak',
          '/bantuan',
        ],
        disallow: [
          '/admin',
          '/studio',
          '/api',
          '/akun',
          '/checkout',
          '/keranjang',
          '/masuk',
          '/daftar',
          '/uploads',
          '/*?*sort=',
          '/*?*filter=',
          '/*?*page=',
          '/pesanan',
          '/lacak-pesanan',
          '/wishlist',
          '/chat',
          '/static',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://majacraft.id/sitemap.xml',
  }
}
