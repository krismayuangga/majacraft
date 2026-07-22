1. Konsep Utama: "The Phygital Gateway"
- Marketplace ini bukan sekadar toko online, melainkan gerbang Hybrid Physical & Digital Commerce
- Phygital Loop: Menghubungkan karya fisik nyata (seperti patung batu atau ukiran) dengan sertifikat digital NFT secara otomatis
- Zero Barrier (Rupiah First): Seluruh antarmuka menggunakan mata uang Rupiah untuk menghilangkan hambatan teknis Web3 bagi seniman tradisional dan kolektor lokal
- Kedaulatan Kreator: Fokus pada pengembalian margin keuntungan ke seniman dengan memotong biaya perantara galeri konvensional

---

# ROADMAP PENGEMBANGAN MAJA MARKETPLACE
*Last updated: 2026-07-09*

## ✅ FASE 1 — FRONTEND SELESAI

### Halaman & Komponen
- [x] Homepage — Hero Banner (3 slide, foto asli), Kategori (scroll mobile), Flash Sale, Product Grid
- [x] Halaman Produk (/produk) — Filter sidebar, sort, grid/list view
- [x] Detail Produk (/produk/[slug]) — Gallery, spesifikasi, Sertifikat Digital, related products
- [x] Studio Seniman (/studio) — Dashboard seller: ringkasan, kelola karya, pesanan, statistik
- [x] Dashboard Admin (/admin) — Kurasi produk, manajemen pengguna, keuangan
- [x] Layout — Navbar desktop, Navbar mobile compact, Bottom Navigation mobile, Footer

### UI/UX
- [x] Tema "Ancient-Tech" — dark stone + neon gold, custom CSS utilities
- [x] Gambar kategori asli (10 kategori, dari Gemini AI)
- [x] Banner hero asli (3 banner, foto sinematik dari Gemini AI)
- [x] Responsive design — desktop + mobile (seperti Tokopedia)
- [x] Bottom Nav mobile — 5 tab: Beranda, Cari, Keranjang (elevated), Pesanan, Akun

---

## 🚧 FASE 2 — FRONTEND LANJUTAN (PRIORITAS SEKARANG)

### A. Halaman Auth
- [ ] /masuk — Login (email/password + Google OAuth)
- [ ] /daftar — Register (pilih role: Pembeli / Seniman)
- [ ] /lupa-password — Reset password via email

### B. Halaman Transaksi Buyer
- [ ] /keranjang — Cart: daftar item, ubah qty, hapus, summary total
- [ ] /checkout — Pilih alamat, pilih kurir (JNE/J&T/SiCepat), pilih pembayaran, konfirmasi
- [ ] /pesanan — List semua pesanan dengan status
- [ ] /pesanan/[id] — Detail pesanan: status escrow, tracking kurir real-time

### C. Halaman Akun
- [ ] /akun — Profil pengguna: foto, nama, alamat, ubah password
- [ ] /akun/alamat — Kelola alamat pengiriman (tambah, edit, hapus)
- [ ] /wishlist — Daftar karya yang disimpan

### D. Halaman Chat
- [ ] /chat — Inbox semua percakapan
- [ ] /chat/[id] — Detail chat buyer ↔ seller (real-time)

### E. Halaman Lainnya
- [ ] /ruang-budaya — Portal komunitas & proposal acara
- [ ] /lacak-pesanan — Lacak paket tanpa login
- [ ] /bantuan — FAQ & pusat bantuan

---

## 🗄️ FASE 3 — BACKEND & DATABASE

### Setup Database
- [ ] PostgreSQL + Prisma ORM
- [ ] Schema: User, Product, Category, Order, OrderItem, Cart, CartItem, Review, Chat, Message, Certificate

### Authentication
- [ ] NextAuth.js — Email/password + Google OAuth
- [ ] JWT session management
- [ ] Role-based access: buyer / seller / admin
- [ ] Middleware proteksi route /studio, /admin, /akun

### API Routes (/src/app/api/)
- [ ] GET/POST /api/products — List & create produk
- [ ] GET/PUT/DELETE /api/products/[id] — Detail, update, hapus
- [ ] GET /api/categories — List kategori
- [ ] POST /api/cart — Tambah ke keranjang
- [ ] GET/PUT/DELETE /api/cart — Kelola keranjang
- [ ] POST /api/orders — Buat pesanan baru
- [ ] GET /api/orders — List pesanan user
- [ ] GET /api/orders/[id] — Detail pesanan
- [ ] POST /api/chat/[orderId] — Kirim pesan
- [ ] GET /api/chat — Inbox pesan
- [ ] POST /api/upload — Upload gambar produk

### Smart Escrow (Blockchain Invisible)
- [ ] BSC smart contract — escrow Rupiah ↔ stablecoin (internal)
- [ ] Trigger otomatis dari status kurir API
- [ ] Mint NFT Certificate saat produk didaftarkan (background)
- [ ] Transfer NFT ke pembeli saat transaksi selesai

---

## 💳 FASE 4 — PAYMENT & LOGISTIK

### Payment Gateway
- [ ] Midtrans — QRIS, VA Bank (BCA/BNI/Mandiri), GoPay, OVO, Dana, ShopeePay
- [ ] Webhook Midtrans untuk update status pembayaran
- [ ] Otomatis lock escrow saat pembayaran confirmed

### Integrasi Kurir
- [ ] JNE API — cek ongkir + tracking
- [ ] J&T API — cek ongkir + tracking
- [ ] SiCepat API — cek ongkir + tracking
- [ ] Webhook tracking: status "Delivered" → trigger escrow release

### Fee Platform
- [ ] 5% auto-deduct dari setiap transaksi
- [ ] Dashboard admin: laporan fee terkumpul

---

## 🚀 FASE 5 — PRODUCTION

### Deployment
- [ ] Domain setup (majabazaar.com / majacraft.com / maja.id)
- [ ] VPS / cloud deployment (sudah punya server di 72.61.208.189)
- [ ] Nginx reverse proxy + SSL (Let's Encrypt)
- [ ] PM2 ecosystem config
- [ ] Environment variables production

### Optimasi
- [ ] Image optimization (CDN / Cloudflare)
- [ ] SEO: sitemap, meta tags, structured data produk
- [ ] PWA manifest untuk install di mobile
- [ ] Performance: lazy loading, code splitting

---

## 📱 FASE 6 — FLUTTER MOBILE APP

### Strategi
- Flutter consume REST API yang sama dengan web
- Shared logic: products, categories, auth, orders, chat
- Tampilan native Android/iOS dengan tema Ancient-Tech

### Halaman Flutter
- [ ] Splash screen + onboarding
- [ ] Home (banner, kategori, produk)
- [ ] Produk & detail
- [ ] Cart & checkout
- [ ] Pesanan & tracking
- [ ] Chat real-time
- [ ] Profil & studio seniman

---

## 🔮 FASE 7 — TOKEN & WEB3 (2027)

### MAJA Token Integration
- [ ] Koneksi ke themaja.com token (BSC)
- [ ] Reward sistem: buyer dapat MAJA token per transaksi
- [ ] Cultural DAO: voting proposal budaya dengan MAJA token
- [ ] NFT Certificate visible di wallet user (opsional)
- [ ] Staking: seller stake MAJA untuk boost visibilitas produk

---

## KEBIJAKAN PRIVASI & KEAMANAN DATA

### Prinsip Utama: Zero Contact Exposure
Nomor HP, email pribadi, dan alamat lengkap TIDAK PERNAH ditampilkan antara buyer dan seller.
Semua komunikasi WAJIB melalui fitur Chat internal MAJA.

### Apa yang Ditampilkan ke Publik:
| Data | Buyer bisa lihat | Seller bisa lihat | Admin |
|---|---|---|---|
| Nama depan + inisial | ✅ | ✅ | ✅ |
| Kota/Provinsi | ✅ | ✅ | ✅ |
| Rating & ulasan | ✅ | ✅ | ✅ |
| Email | ❌ | ❌ | ✅ |
| Nomor HP | ❌ | ❌ | ✅ |
| Alamat lengkap | ❌ | ✅ (hanya untuk pengiriman) | ✅ |
| Nomor rekening | ❌ | ❌ | ✅ |
| NIK/KTP | ❌ | ❌ | ✅ |

### Alur Komunikasi yang Diizinkan:
- Buyer ↔ Seller: HANYA via Chat MAJA (fitur /chat)
- Notifikasi pesanan: via email platform + push notification
- Konfirmasi kurir: via email platform
- DILARANG: share nomor HP, BBM, Telegram, WA di chat platform

### Perlindungan Data:
- Password di-hash dengan bcrypt (min salt 12)
- Nomor rekening dienkripsi di database
- NIK/KTP disimpan terenkripsi, hanya admin tertentu yang akses
- Session token expire 30 hari, refresh token 90 hari
- Rate limiting pada API auth (max 5 percobaan login per IP per menit)

---



```
1. /masuk & /daftar          ← Auth pages (paling mendasar)
2. /keranjang                ← Cart page
3. /checkout                 ← Checkout flow
4. /pesanan & /pesanan/[id]  ← Order tracking
5. /akun                     ← Profil user
6. /chat                     ← Buyer-seller messaging
7. Database + Prisma setup   ← Backend foundation
8. Auth (NextAuth)           ← Login real
9. API Routes                ← Connect frontend ke DB
10. Payment (Midtrans)       ← Transaksi nyata
```

---



2. Struktur Menu & Fitur Detail
A. Halaman Utama (Home: Warisan Digital)
- Visual: Menggunakan elemen desain bertema batu candi, sirkuit emas, dan motif Nusantara
- Hero Section: Menampilkan mahakarya "Karya Minggu Ini" (misalnya patung Ganesha atau Garuda) dengan label "Verified Phygital"
- Fitur Live Count Cultural Fund: Menampilkan transparansi dana abadi budaya (2,5% dari transaksi) yang terkumpul secara real-time

B. Galeri Phygital (Marketplace)
- Filter Kategori: Berdasarkan material (Batu, Kayu, Logam) atau wilayah asal pulau (17.508 Pulau)
- Product Card: Menampilkan foto karya fisik berkualitas tinggi, spesifikasi dimensi, dan tombol "Lihat Sertifikat On-chain"
- Sistem Pembayaran: Integrasi Payment Gateway lokal (QRIS, VA Bank, E-wallet) yang otomatis memicu proses di blockchain

C. Dashboard Kreator (Studio Seniman)
- Fitur Satu Klik Upload: Seniman cukup mengunggah foto dan deskripsi; sistem otomatis melakukan minting NFT Certificate tanpa biaya (gas fee disubsidi MAJA)
- Fitur Lapor Penjualan Eksternal: Menu khusus bagi seniman untuk mengalihkan sertifikat digital jika karya fisik terjual secara offline, guna menjaga riwayat kepemilikan (provenance)
- Manajemen Logistik: Integrasi API kurir untuk melacak pengiriman karya fisik

D. Brankas Digital (User Wallet)
- Tampilan Sederhana: Menampilkan saldo Rupiah dan koleksi NFT yang dimiliki tanpa perlu pengelolaan seed phrase yang rumit
- Status Smart Escrow: Menampilkan dana yang sedang "dikunci" dalam sistem selama proses pengiriman barang fisik berlangsung

3. Alur Transaksi "Smart Escrow Rupiah"
Untuk memastikan keamanan tanpa membingungkan user, alurnya adalah:
- Komitmen: Pembeli membayar via Rupiah; sistem MAJA mencatatnya dan mengunci status NFT
- Verifikasi Logistik: Seniman mengirim barang fisik; status kurir terpantau otomatis oleh sistem MAJA
- Konfirmasi & Rilis: Begitu barang diterima pembeli, sistem secara otomatis mencairkan Rupiah ke rekening seniman dan mentransfer kepemilikan NFT ke akun pembeli

4. Arahan Desain (UI/UX)
- Tema Visual: "Ancient-Tech". Gabungan tekstur batu alam (seperti visual Sumpah Palapa) dengan elemen futuristik neon hijau/emas
- Tipografi: Tegas namun elegan, memberikan kesan monumental seperti prasasti
- User Experience: Minimalis. Jauhkan istilah teknis seperti "Hexadecimal address" atau "Minting". Gunakan istilah "Sertifikat Digital" dan "Kirim Karya"

5. Nilai Tambah untuk Komunitas (Cultural Integration)
- Menu Ruang Budaya: Tempat komunitas mengajukan proposal pameran atau workshop yang akan didanai oleh 2,5% Cultural Fund
- Museum Virtual: Galeri imersif untuk melihat aset budaya yang telah didigitalisasi (Heritage Preservation)


Detail teknis dan operasional mendalam :

1. Arsitektur "Logistics-to-Blockchain Bridge" (Penting!)
- Smart Escrow tidak dipicu oleh klik manual, melainkan oleh data real-time.
Trigger Otomatis: integrasikan API pihak ketiga (seperti JNE/J&T/SiCepat) ke dalam smart contract

- Logika Kode: Begitu status kurir berubah menjadi "Delivered", sistem harus secara otomatis melepaskan dana Rupiah ke seniman dan mengirimkan NFT ke kolektor
. Ini adalah kunci dari Kepastian Transaksi

2. Spesifikasi Metadata NFT "Phygital"
NFT di MAJA bukan sekadar gambar, tapi Sertifikat Digital On-chain
-  Bukti Fisik: Link ke foto resolusi tinggi, dimensi (panjang, lebar, tinggi), berat, dan material karya (seperti batu atau kayu)
- Provenance (Asal-usul): Riwayat kepemilikan yang dimulai dari "Minter" (seniman asli) untuk memastikan keaslian mutlak dan mencegah pemalsuan karya di masa depan

3. Detail "Zero Barrier" Backend (Solusi untuk Seniman Tradisional)
- Untuk benar-benar mencapai Hambatan Nol, membangun sistem Account Abstraction:
Gasless Transaction: Sistem harus mampu melakukan gas station di mana MAJA membayar biaya transaksi (gas fee) atas nama seniman
- Social Login: User harus bisa masuk menggunakan Email/Google yang otomatis men-generate wallet di latar belakang tanpa menunjukkan private key yang membingungkan

4. Detail Visual "Ancient-Tech" (UI/UX)
Agar desainnya tidak terlihat seperti marketplace generik, gunakan :
- Elemen Interaktif: Efek "parallax" pada tekstur batu candi di halaman utama

- Simbolisme Nusantara: Gunakan elemen visual sirkuit emas yang membentuk pola batik atau ukiran tradisional untuk menekankan penggabungan masa lalu dan masa depan
- Dashboard yang Manusiawi: Menu jangan menggunakan kata "Minting" atau "Wallet Address", gunakan istilah yang lebih akrab bagi seniman seperti "Daftarkan Karya" dan "Brankas Digital"

5. Mekanisme "Cultural DAO" & Fund
Siklus Ekonomi Mandiri :
- Alokasi Otomatis: Setiap transaksi Rupiah harus otomatis memisahkan 2,5% ke dalam dompet khusus Cultural Fund

- Portal Proposal: Buat menu khusus di mana komunitas bisa mengunggah proposal pameran atau digitalisasi warisan (Heritage) untuk divoting oleh pemegang token di masa depan (rencana 2027)


Metadata untuk NFT Phygital di ekosistem MAJA dirancang sebagai sertifikat digital komprehensif yang menjamin hubungan antara aset digital dan karya fisik
. Data yang dimasukkan ke dalam metadata tersebut meliputi:

- Informasi Visual dan Deskriptif: Metadata mencakup foto karya fisik berkualitas tinggi serta deskripsi lengkap yang diunggah oleh seniman saat proses pendaftaran karya
- Spesifikasi Fisik Detail: Data ini mencakup spesifikasi dimensi (panjang, lebar, dan tinggi), berat, serta jenis material yang digunakan untuk karya tersebut, seperti batu, kayu, atau logam
- Bukti Keaslian (NFT Certificate): Setiap karya memiliki sertifikat digital on-chain yang berfungsi sebagai bukti keaslian mutlak yang tidak dapat dipalsukan
- Riwayat Kepemilikan (On-chain Provenance): Salah satu data paling krusial adalah catatan riwayat kepemilikan yang bersifat abadi dan tidak dapat diubah (immutable) di blockchain, dimulai dari seniman asli sebagai pencipta pertama
- Identitas Digital Global: Metadata ini memberikan identitas digital yang memungkinkan kolektor global memverifikasi riwayat dan otentisitas mahakarya Nusantara dengan kepercayaan penuh melalui sistem "Lihat Sertifikat On-chain"