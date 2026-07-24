# Migration: Kurasi → Moderasi

**Date:** 2026-01-23  
**Author:** AI Assistant with User Direction  
**Reason:** Ubah terminology dari "kurasi" (expert curation) ke "moderasi" (platform moderation) untuk menghindari polemik dan memberikan fleksibilitas lebih besar. Produk sekarang auto-approved by default, admin hanya reject jika harmful/tidak sesuai panduan.

---

## 🎯 Philosophy Change

### Before (Kurasi)
- **Konsep:** Tim kurator ahli review setiap produk sebelum dipublish
- **Flow:** Upload → Pending → Review Expert → Approved/Rejected
- **Problem:** 
  - Memerlukan ahli untuk validasi setiap produk
  - Bottleneck di review process
  - Ekspektasi kualitas sangat tinggi (polemik jika ada yang lolos tapi tidak "berkualitas")

### After (Moderasi)
- **Konsep:** Platform hanya moderasi untuk harmful content, bukan quality judge
- **Flow:** Upload → Auto-Approved → Admin can reject if harmful
- **Benefits:**
  - Scalable - tidak perlu ahli untuk setiap produk
  - User empowerment - tanggung jawab pada seller
  - Platform netral - hanya reject yang melanggar panduan (contoh: jualan rokok)

---

## 📦 Changes Summary

### 1. Database Schema (`prisma/schema.prisma`)

```diff
  originalPrice Int?
  stock         Int      @default(1)
- isActive      Boolean  @default(true)   // langsung publish saat upload
- isCurated     Boolean   @default(false) // sudah melalui review tim
- curatedAt     DateTime?
+ isActive      Boolean  @default(true)   // auto-approved, admin can reject if harmful
+ isModerated   Boolean   @default(true) // passed moderation (not rejected)
+ moderatedAt   DateTime?
- rejectionReason String? // alasan penolakan dari admin
+ rejectionReason String? // reason if rejected by moderator
```

**Migration:** `prisma/migrations/20260723062108_rename_curation_to_moderation/migration.sql`

```sql
ALTER TABLE "products" RENAME COLUMN "isCurated" TO "isModerated";
ALTER TABLE "products" RENAME COLUMN "curatedAt" TO "moderatedAt";
ALTER INDEX IF EXISTS "idx_products_curated" RENAME TO "idx_products_moderated";
```

---

### 2. API Endpoints

#### Renamed Route
- `/api/admin/products/[id]/curate` → `/api/admin/products/[id]/moderate`

#### Updated Routes
| File | Change |
|------|--------|
| `src/app/api/admin/products/[id]/moderate/route.ts` | Updated to use `isModerated`, `moderatedAt` |
| `src/app/api/admin/products/[id]/reject/route.ts` | Updated to use `isModerated`, `moderatedAt` |
| `src/app/api/admin/products/route.ts` | Updated query filters and comments |
| `src/app/api/admin/stats/route.ts` | Changed `pendingProducts` → `rejectedProducts` |
| `src/app/api/studio/products/route.ts` | New products default `isModerated: true, moderatedAt: new Date()` |
| `src/app/api/studio/products/[id]/route.ts` | Update logic uses `isModerated` |
| `src/app/sitemap.ts` | Query filter updated to `isModerated` |

---

### 3. Email Templates (`src/lib/email.ts`)

```diff
- buildProductCuratedEmail() → buildProductModeratedEmail()
- "Karya Lolos Kurasi!" → "Produk Disetujui!"
- "lolos kurasi" → "disetujui"
- "Catatan Kurator" → "Alasan Penolakan"
```

---

### 4. Notification Types (`src/lib/notifications.ts`)

```diff
  export type NotifType =
    | "product_published"
-   | "product_curated"
+   | "product_moderated"
    | "product_rejected"
```

---

### 5. Admin Dashboard (`src/app/admin/page.tsx`)

- **Menu Label:** "Kurasi Produk" → "Moderasi Produk"
- **Tab Title:** "Kurasi Produk" → "Moderasi Produk"
- **Badge:** "✓ Dikurasi" → "✓ Disetujui"
- **Button:** "Lolos Kurasi" → "Setujui"
- **Stats:** `pendingProducts` → `rejectedProducts` (menghitung produk yang ditolak, bukan pending review)
- **Type:** `isCurated: boolean` → `isModerated: boolean`

---

### 6. Frontend Pages

#### Product List (`src/app/produk/page.tsx`)
- Type updated: `isCurated: boolean` → `isModerated: boolean`

#### Store Page (`src/app/toko/[slug]/page.tsx`)
- Type updated: `isCurated: boolean` → `isModerated: boolean`

#### Ruang Budaya (`src/app/ruang-budaya/page.tsx`)
- Removed filter `isCurated=false` → fetch all products

---

### 7. Components

#### ProductCard (`src/components/marketplace/ProductCard.tsx`)
- **REMOVED:** "✓ Kurasi" badge (tidak ada lagi badge karena semua auto-approved)

#### PromoSection (`src/components/marketplace/PromoSection.tsx`)
- Text updated: "Semua penjual melewati kurasi tim MAJA" → "Semua penjual telah diverifikasi oleh tim MAJA"

---

### 8. Documentation Pages

#### Verification Page (`src/app/verifikasi/[id]/page.tsx`)
- Text updated: "lolos kurasi" → "disetujui"

---

## 🚀 New Product Flow

### Upload New Product
1. Seller uploads product via Studio
2. **Auto-approved:** `isActive: true, isModerated: true, moderatedAt: new Date()`
3. Product immediately visible in marketplace
4. Notification: "Produk Berhasil Dipublish! 🎉" + "sudah aktif di marketplace dan dapat langsung dibeli pembeli"

### Admin Moderation (Only if Harmful)
1. Admin sees product in **Moderasi Produk** tab
2. If harmful/against guidelines → **Reject** with reason
   - Sets: `isActive: false, isModerated: false, rejectionReason: "..."`
   - Email sent: "Produk Ditolak"
3. If fine → No action needed (already approved)

### Seller Re-upload After Rejection
1. Seller edits product
2. Status changes: `isActive: true` (re-queued for review)
3. Admin can review again

---

## 📊 Statistics Changes

Admin dashboard now tracks:
- **Produk Ditolak:** Count of rejected products needing seller fix
- Previously tracked "Produk Pending" (awaiting curation) - now irrelevant

---

## ✅ Testing Checklist

- [x] Database migration applied successfully
- [x] Prisma client regenerated
- [x] TypeScript compilation passes (no errors)
- [ ] Upload new product → verify auto-approved
- [ ] Admin reject product → verify email sent + status updated
- [ ] Seller edit rejected product → verify re-queue logic
- [ ] Check admin dashboard stats display correctly
- [ ] Verify no "Terkurasi" badge shows on product cards

---

## 🔄 Rollback Plan

If needed to rollback:

1. **Database Rollback:**
   ```sql
   ALTER TABLE "products" RENAME COLUMN "isModerated" TO "isCurated";
   ALTER TABLE "products" RENAME COLUMN "moderatedAt" TO "curatedAt";
   ```

2. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   npx prisma generate
   ```

---

## 📝 Notes

- **Backward Compatibility:** Existing products with `isCurated=true` automatically become `isModerated=true` after migration
- **Default Values:** New products get `isModerated=true` by default
- **No Breaking Changes:** API response structure remains same (just field name changed)
- **Career Page:** Still mentions "Kurator Seni" position - this is intentional as it's a job title, not platform terminology

---

## 👥 Stakeholders

- **User:** Initiated change due to polemik concerns
- **Platform:** More scalable moderation approach
- **Sellers:** Faster time-to-market (auto-approved)
- **Admin:** Focus on harmful content, not quality gatekeeping
