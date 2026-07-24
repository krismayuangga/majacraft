# 🛡️ Dispute Resolution System - MajaCraft

Sistem komplain & mediasi seperti Tokopedia untuk menangani sengketa pembeli-penjual.

---

## 📋 Flow Overview

```
BUYER                    SYSTEM                    SELLER                    ADMIN
  │                         │                         │                         │
  ├─ Submit Komplain ──────>│                         │                         │
  │  (foto, deskripsi)      │                         │                         │
  │                         ├─ Notif ───────────────>│                         │
  │                         │                         │                         │
  │                         │<─ Response ─────────────┤                         │
  │                         │   (setuju/tolak)        │                         │
  │                         │                         │                         │
  │<─ Notif Response ───────┤                         │                         │
  │                         │                         │                         │
  ├─ Escalate to Admin ────>│                         │                         │
  │  (jika tidak sepakat)   │                         │                         │
  │                         ├─ Join Chat Room ───────>│                         │
  │                         │                         │                         │
  │                         ├─ Admin Join ──────────────────────────────────────>│
  │<─ Chat Mediasi ─────────┼────────────────────────>┼────────────────────────>│
  │                         │                         │                         │
  │                         │<─ Decision ──────────────────────────────────────┤
  │                         │   (refund/retur/close)  │                         │
  │<─ Resolution Applied ───┤                         │                         │
  │                         │                         │                         │
```

---

## 🗄️ Database Schema

### 1. Dispute Table
```prisma
model Dispute {
  id              String          @id @default(cuid())
  disputeNumber   String          @unique // DSP-202607-XXXXX
  orderId         String
  orderItemId     String?         // specific item (optional)
  buyerId         String
  sellerId        String
  
  // Complaint Details
  reason          DisputeReason   // enum: not_as_described, damaged, incomplete, not_received, etc
  description     String          @db.Text
  evidenceUrls    String[]        // array foto bukti
  requestedAction DisputeAction   // refund_full, refund_partial, replacement, return
  
  // Status & Timeline
  status          DisputeStatus   @default(PENDING_SELLER)
  
  // Seller Response
  sellerResponse  String?         @db.Text
  sellerAgreed    Boolean?
  sellerRespondedAt DateTime?
  
  // Admin Mediation
  assignedAdminId String?
  adminNotes      String?         @db.Text
  
  // Resolution
  resolution      DisputeResolution? // refund_approved, replacement_sent, closed_no_issue, etc
  resolutionNotes String?         @db.Text
  resolvedAt      DateTime?
  resolvedBy      String?         // userId of resolver (admin/auto)
  
  // Refund Details (if applicable)
  refundAmount    Int?
  refundedAt      DateTime?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  order           Order           @relation(fields: [orderId], references: [id])
  buyer           User            @relation("DisputeBuyer", fields: [buyerId], references: [id])
  seller          User            @relation("DisputeSeller", fields: [sellerId], references: [id])
  assignedAdmin   User?           @relation("DisputeAdmin", fields: [assignedAdminId], references: [id])
  messages        DisputeMessage[]
  timeline        DisputeTimeline[]
  
  @@map("disputes")
}

enum DisputeReason {
  NOT_AS_DESCRIBED      // Tidak sesuai deskripsi
  DAMAGED               // Rusak/cacat
  INCOMPLETE            // Tidak lengkap
  NOT_RECEIVED          // Tidak diterima
  WRONG_ITEM            // Barang salah
  FAKE_PRODUCT          // Produk palsu
  OTHER                 // Lainnya
}

enum DisputeAction {
  REFUND_FULL           // Refund penuh
  REFUND_PARTIAL        // Refund sebagian
  REPLACEMENT           // Ganti barang
  RETURN_REFUND         // Retur + refund
  REPAIR                // Perbaikan
}

enum DisputeStatus {
  PENDING_SELLER        // Menunggu response seller
  SELLER_RESPONDED      // Seller sudah respond
  IN_MEDIATION          // Eskalasi ke admin
  RESOLVED              // Selesai
  CLOSED                // Ditutup
  CANCELLED             // Dibatalkan buyer
}

enum DisputeResolution {
  REFUND_APPROVED       // Refund disetujui
  REFUND_REJECTED       // Refund ditolak
  REPLACEMENT_SENT      // Ganti barang dikirim
  RETURN_APPROVED       // Retur disetujui
  CLOSED_NO_ISSUE       // Ditutup tidak ada masalah
  CLOSED_RESOLVED       // Ditutup sudah selesai
  CLOSED_BUYER_FAULT    // Ditutup kesalahan buyer
}
```

### 2. DisputeMessage Table (Chat Room)
```prisma
model DisputeMessage {
  id          String        @id @default(cuid())
  disputeId   String
  senderId    String
  senderRole  Role          // BUYER, SELLER, or ADMIN
  message     String        @db.Text
  attachments String[]      // array foto/dokumen
  isSystemMsg Boolean       @default(false) // automated message
  createdAt   DateTime      @default(now())
  
  dispute     Dispute       @relation(fields: [disputeId], references: [id], onDelete: Cascade)
  sender      User          @relation(fields: [senderId], references: [id])
  
  @@map("dispute_messages")
}
```

### 3. DisputeTimeline Table (Activity Log)
```prisma
model DisputeTimeline {
  id          String   @id @default(cuid())
  disputeId   String
  action      String   // "created", "seller_responded", "escalated", "admin_joined", "resolved"
  description String   @db.Text
  actorId     String?  // user who did the action
  metadata    Json?    // additional data
  createdAt   DateTime @default(now())
  
  dispute     Dispute  @relation(fields: [disputeId], references: [id], onDelete: Cascade)
  
  @@map("dispute_timeline")
}
```

---

## 🔌 API Endpoints

### Buyer Endpoints
- `POST /api/disputes` - Submit komplain baru
- `GET /api/disputes` - List komplain user
- `GET /api/disputes/[id]` - Detail komplain
- `POST /api/disputes/[id]/cancel` - Cancel komplain
- `POST /api/disputes/[id]/escalate` - Escalate ke admin
- `POST /api/disputes/[id]/messages` - Send chat message
- `GET /api/disputes/[id]/messages` - Get chat history

### Seller Endpoints
- `GET /api/seller/disputes` - List komplain toko
- `POST /api/seller/disputes/[id]/respond` - Response komplain (setuju/tolak)
- `POST /api/seller/disputes/[id]/messages` - Send chat message

### Admin Endpoints
- `GET /api/admin/disputes` - List all disputes
- `POST /api/admin/disputes/[id]/assign` - Assign admin
- `POST /api/admin/disputes/[id]/resolve` - Resolve dispute
- `POST /api/admin/disputes/[id]/refund` - Process refund
- `POST /api/admin/disputes/[id]/messages` - Send chat message

---

## 🎨 UI Components

### 1. Order Detail Page - Buyer Actions
```tsx
{order.status === "DELIVERED" && (
  <div className="flex gap-2">
    <button onClick={handleCompleteOrder}>
      ✓ Pesanan Selesai
    </button>
    <button onClick={handleCreateDispute}>
      ⚠️ Ajukan Komplain
    </button>
  </div>
)}
```

### 2. Dispute Form Modal
```tsx
<DisputeForm>
  <Select name="reason">
    <option>Tidak sesuai deskripsi</option>
    <option>Rusak/cacat</option>
    <option>Tidak lengkap</option>
    <option>Tidak diterima</option>
  </Select>
  <Textarea name="description" placeholder="Jelaskan masalah..." />
  <ImageUpload name="evidence" max={5} />
  <Select name="requestedAction">
    <option>Refund penuh</option>
    <option>Refund sebagian</option>
    <option>Ganti barang</option>
    <option>Retur + refund</option>
  </Select>
</DisputeForm>
```

### 3. Dispute Chat Room
```tsx
<DisputeChatRoom disputeId={id}>
  {/* Header */}
  <div className="dispute-header">
    <span>Komplain #{disputeNumber}</span>
    <Badge status={status} />
  </div>
  
  {/* Participants */}
  <div className="participants">
    <Avatar role="buyer" />
    <Avatar role="seller" />
    {adminJoined && <Avatar role="admin" label="Mediator" />}
  </div>
  
  {/* Timeline */}
  <DisputeTimeline events={timeline} />
  
  {/* Messages */}
  <MessageList messages={messages} />
  
  {/* Input */}
  <MessageInput onSend={handleSend} />
  
  {/* Admin Actions (if admin) */}
  {isAdmin && (
    <AdminActions>
      <button onClick={resolveRefund}>Setujui Refund</button>
      <button onClick={closeDispute}>Tutup Komplain</button>
    </AdminActions>
  )}
</DisputeChatRoom>
```

### 4. Admin Dispute Panel
```tsx
<AdminDisputePanel>
  <Tabs>
    <Tab label="Pending" count={pendingCount} />
    <Tab label="In Mediation" count={mediationCount} />
    <Tab label="Resolved" count={resolvedCount} />
  </Tabs>
  
  <DisputeList>
    {disputes.map(d => (
      <DisputeCard
        key={d.id}
        dispute={d}
        onAssign={handleAssign}
        onView={handleView}
      />
    ))}
  </DisputeList>
</AdminDisputePanel>
```

---

## ⚙️ Business Logic

### Auto-Complete Logic
```typescript
// Pesanan auto-complete 3 hari setelah DELIVERED jika tidak ada komplain
if (order.status === "DELIVERED") {
  const threeDaysLater = addDays(order.deliveredAt, 3);
  if (now() > threeDaysLater && !hasActiveDispute) {
    await completeOrder(order.id);
    await releaseEscrow(order.id);
  }
}
```

### Dispute Deadline
```typescript
// Buyer hanya bisa komplain max 3 hari setelah DELIVERED
const canCreateDispute = (order: Order) => {
  if (order.status !== "DELIVERED") return false;
  const daysSinceDelivered = differenceInDays(now(), order.deliveredAt);
  return daysSinceDelivered <= 3;
};
```

### Seller Response Deadline
```typescript
// Seller harus response dalam 2x24 jam, jika tidak auto-eskalasi ke admin
if (dispute.status === "PENDING_SELLER") {
  const deadline = addHours(dispute.createdAt, 48);
  if (now() > deadline && !dispute.sellerResponse) {
    await escalateToAdmin(dispute.id);
  }
}
```

---

## 🔔 Notifications

### Buyer Notifications
- "Komplain Anda telah diterima"
- "Penjual telah merespons komplain Anda"
- "Komplain dieskalasi ke admin"
- "Komplain selesai - Refund diproses"

### Seller Notifications
- "Ada komplain baru untuk pesanan #XXX"
- "Komplain dieskalasi ke admin - segera bergabung di chat"
- "Komplain selesai"

### Admin Notifications
- "Komplain baru perlu mediasi"
- "Penjual tidak merespons - komplain dieskalasi"

---

## 📊 Admin Dashboard Metrics

- Total komplain aktif
- Avg. resolution time
- Refund rate
- Top dispute reasons
- Seller with most disputes

---

## 🚀 Implementation Priority

1. **Phase 1:** Database schema + migrations
2. **Phase 2:** API endpoints (buyer submit, seller respond)
3. **Phase 3:** UI - Dispute form & list
4. **Phase 4:** Chat room implementation
5. **Phase 5:** Admin panel
6. **Phase 6:** Notifications & emails
7. **Phase 7:** Auto-escalation cron jobs

