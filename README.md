# 🎨 MajaCraft - Marketplace Kerajinan Nusantara

Platform marketplace modern untuk kerajinan tangan Indonesia dengan sertifikasi digital NFT.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

## ✨ Features

- 🛍️ **Marketplace** - Jual beli kerajinan tangan Indonesia
- 🔐 **Authentication** - NextAuth.js dengan OTP & PIN
- 📜 **NFT Certificate** - Sertifikasi digital untuk produk phygital
- 💳 **Multi Payment** - iPaymu, Xendit, Midtrans
- 🏪 **Multi-Vendor** - Sistem toko untuk seniman/pengrajin
- 📱 **Responsive** - Mobile-first design
- 🎭 **Ruang Budaya** - Event & acara budaya
- 📊 **Admin Dashboard** - Kelola produk, orders, users
- 🔍 **SEO Optimized** - Structured data & sitemap
- 🚀 **Performance** - Next.js 16 dengan Turbopack

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Payment**: iPaymu, Xendit, Midtrans
- **Storage**: Local filesystem (production: AWS S3)
- **Deployment**: PM2 + NGINX

## 📋 Prerequisites

- Node.js 18+ (recommended: 20+)
- PostgreSQL 15+
- npm atau yarn atau pnpm

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/krismayuangga/majacraft.git
cd majacraft
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/majacraft"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
maja-marketplace/
├── src/
│   ├── app/              # Next.js 13+ App Router
│   │   ├── (auth)/       # Auth pages (login, register)
│   │   ├── admin/        # Admin dashboard
│   │   ├── api/          # API routes
│   │   ├── produk/       # Product pages
│   │   ├── toko/         # Store pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   ├── lib/             # Utilities & helpers
│   └── styles/          # Global styles
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── public/              # Static files
└── uploads/             # User uploads (gitignored)
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev    # Create new migration
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma Client

# Deployment
pm2 start ecosystem.config.js    # Start with PM2
pm2 restart majacraft           # Restart app
pm2 logs majacraft              # View logs
```

## 🌐 Deployment

### Production Build

```bash
npm run build
npm run start
```

### PM2 Deployment

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### NGINX Configuration

```nginx
server {
    listen 80;
    server_name majacraft.id;
    
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Security

- ✅ Environment variables untuk credentials
- ✅ HTTPS required di production
- ✅ Rate limiting di API routes
- ✅ Input validation & sanitization
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React)
- ✅ CSRF protection (NextAuth)

## 📝 Environment Variables

Lihat [.env.example](./.env.example) untuk daftar lengkap.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret key
- `NEXTAUTH_URL` - Base URL aplikasi

**Optional:**
- `MIDTRANS_*` - Midtrans payment gateway
- `XENDIT_*` - Xendit payment gateway
- `IPAYMU_*` - iPaymu payment gateway
- `SMTP_*` - Email configuration
- `AWS_*` - S3 storage (production)

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Private & Confidential - © 2026 MajaCraft

## 👥 Team

- **Developer**: Krisna Mayuangga
- **Platform**: MajaCraft.id

## 📞 Support

- **Website**: https://majacraft.id
- **Email**: support@majacraft.id
- **Documentation**: [AGENTS.md](./AGENTS.md)

---

Built with ❤️ for Indonesian artisans and craftsmen


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
