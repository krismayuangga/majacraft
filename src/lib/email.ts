import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM ?? "MajaCraft <halo@majacraft.id>",
    to,
    subject,
    html,
  });
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
const LOGO_URL = "https://majacraft.id/images/new-logo-majacraft.png";
const BASE_URL = "https://majacraft.id";

function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MajaCraft</title></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1C1A14;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25);">

        <!-- HEADER -->
        <tr>
          <td style="background:#1C1A14;padding:28px 32px 24px;text-align:center;border-bottom:2px solid #C9A84C;">
            <img src="${LOGO_URL}" alt="MajaCraft" width="180" style="display:block;margin:0 auto;max-width:180px;" />
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#151310;padding:20px 32px;border-top:1px solid #2E2920;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <p style="margin:0 0 4px;color:#4A4030;font-size:11px;">© 2026 PT BSE Group Teknologi &nbsp;·&nbsp; Platform Kerajinan Seni Nusantara</p>
                  <p style="margin:0;color:#4A4030;font-size:11px;">
                    <a href="${BASE_URL}" style="color:#6B5A3E;text-decoration:none;">majacraft.id</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:halo@majacraft.id" style="color:#6B5A3E;text-decoration:none;">halo@majacraft.id</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Shared components ────────────────────────────────────────────────────────
function badge(text: string, bg = "#C9A84C", color = "#1C1A14") {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:${bg};border-radius:8px;padding:12px 16px;text-align:center;">
      <span style="color:${color};font-size:15px;font-weight:bold;">${text}</span>
    </td></tr>
  </table>`;
}

function infoCard(rows: { label: string; value: string; gold?: boolean }[], marginBottom = "20px") {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="color:#8A7A62;font-size:13px;padding:6px 0;">${r.label}</td>
      <td style="color:${r.gold ? "#C9A84C" : "#EDE8DE"};font-size:${r.gold ? "15px" : "13px"};font-weight:${r.gold ? "bold" : "normal"};text-align:right;padding:6px 0;">${r.value}</td>
    </tr>`).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#252018;border-radius:10px;padding:16px;margin-bottom:${marginBottom};border:1px solid #2E2920;">
    <tr><td><table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr>
  </table>`;
}

function ctaButton(text: string, url: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr><td style="text-align:center;">
      <a href="${url}" style="display:inline-block;background:#C9A84C;color:#1C1A14;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">${text}</a>
    </td></tr>
  </table>`;
}

function itemsTable(items: { productName: string; qty: number; price?: number }[]) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #2E2920;color:#EDE8DE;font-size:13px;">${i.productName}</td>
      <td style="padding:9px 0;border-bottom:1px solid #2E2920;color:#8A7A62;text-align:center;font-size:13px;">${i.qty}×</td>
      ${i.price !== undefined ? `<td style="padding:9px 0;border-bottom:1px solid #2E2920;color:#C9A84C;text-align:right;font-size:13px;white-space:nowrap;">Rp ${i.price.toLocaleString("id-ID")}</td>` : ""}
    </tr>`).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${rows}</table>`;
}

function greeting(name: string, msg: string) {
  return `<p style="color:#8A7A62;font-size:14px;margin:0 0 4px;">Halo, <strong style="color:#EDE8DE;">${name}</strong></p>
          <p style="color:#EDE8DE;font-size:14px;margin:0 0 24px;line-height:1.6;">${msg}</p>`;
}

// ─── Template 1: OTP ──────────────────────────────────────────────────────────
export function buildOtpEmail(otp: string, type: string) {
  const labels: Record<string, string> = {
    bank_change: "Perubahan Rekening Bank",
    pin_reset: "Set / Ubah PIN Pencairan",
    withdrawal: "Konfirmasi Pencairan Dana",
  };
  const label = labels[type] ?? "Verifikasi";

  return emailLayout(`
    ${badge(`🔐 Kode OTP — ${label}`)}
    <p style="color:#8A7A62;font-size:14px;margin:0 0 24px;">Gunakan kode berikut untuk melanjutkan proses <strong style="color:#EDE8DE;">${label}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td style="background:#252018;border:2px solid #C9A84C;border-radius:10px;padding:24px;text-align:center;">
        <span style="font-size:44px;font-weight:bold;color:#C9A84C;letter-spacing:16px;font-family:monospace;">${otp}</span>
      </td></tr>
    </table>
    <p style="color:#8A7A62;font-size:12px;margin:0 0 6px;">⏱ Berlaku selama <strong style="color:#EDE8DE;">10 menit</strong></p>
    <p style="color:#8A7A62;font-size:12px;margin:0 0 24px;">🔒 Jangan bagikan kode ini kepada siapapun</p>
    <p style="color:#4A4030;font-size:11px;margin:0;text-align:center;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
  `);
}

// ─── Template 2: Order baru → Seller ─────────────────────────────────────────
export function buildNewOrderEmailSeller(order: {
  orderNumber: string;
  total: number;
  items: { productName: string; qty: number; price: number }[];
  address: { province?: string; city?: string } | null;
}, storeName: string) {
  const dest = [order.address?.city, order.address?.province].filter(Boolean).join(", ") || "—";

  return emailLayout(`
    ${badge("🛒 Pesanan Baru Masuk!")}
    ${greeting(storeName, "Ada pesanan baru yang perlu diproses. Segera siapkan pengiriman.")}
    ${infoCard([{ label: "No. Pesanan", value: `#${order.orderNumber}`, gold: true }, { label: "Tujuan", value: dest }])}
    ${itemsTable(order.items)}
    ${infoCard([{ label: "Total Pesanan", value: `Rp ${order.total.toLocaleString("id-ID")}`, gold: true }], "24px")}
    ${ctaButton("Lihat &amp; Proses Pesanan →", `${BASE_URL}/studio`)}
  `);
}

// ─── Template 3: Konfirmasi pembayaran → Pembeli ──────────────────────────────
export function buildOrderConfirmEmail(order: {
  orderNumber: string;
  total: number;
  items: { productName: string; qty: number; price: number }[];
  courierName?: string | null;
  storeName?: string;
}, buyerName: string) {
  const cardRows = [
    { label: "No. Pesanan", value: `#${order.orderNumber}`, gold: true },
    ...(order.storeName ? [{ label: "Toko", value: order.storeName }] : []),
    ...(order.courierName ? [{ label: "Kurir", value: order.courierName }] : []),
    { label: "Total Dibayar", value: `Rp ${order.total.toLocaleString("id-ID")}`, gold: true },
  ];

  return emailLayout(`
    ${badge("✅ Pembayaran Berhasil!", "#1A5E2A", "#FFFFFF")}
    ${greeting(buyerName, "Pembayaran Anda telah dikonfirmasi. Penjual sedang memproses pesanan Anda.")}
    ${infoCard(cardRows)}
    ${itemsTable(order.items)}
    ${ctaButton("Pantau Status Pesanan →", `${BASE_URL}/akun/pesanan`)}
    <p style="color:#8A7A62;font-size:12px;text-align:center;margin:0;">Penjual akan mengemas dan mengirimkan pesanan Anda secepatnya.</p>
  `);
}

// ─── Template 4: Pesanan dikirim → Pembeli ────────────────────────────────────
export function buildOrderShippedEmail(order: {
  orderNumber: string;
  trackingNumber: string;
  courierName?: string | null;
  items: { productName: string; qty: number }[];
}, buyerName: string) {
  return emailLayout(`
    ${badge("🚚 Pesananmu Sedang Dalam Perjalanan!", "#4C1D95", "#FFFFFF")}
    ${greeting(buyerName, "Pesanan Anda telah dikirim oleh penjual dan sedang dalam perjalanan.")}
    ${infoCard([
      { label: "No. Pesanan", value: `#${order.orderNumber}` },
      { label: "Kurir", value: order.courierName ?? "—" },
      { label: "No. Resi", value: order.trackingNumber, gold: true },
    ])}
    ${itemsTable(order.items)}
    ${ctaButton("Cek Status Pesanan →", `${BASE_URL}/akun/pesanan`)}
    <p style="color:#8A7A62;font-size:12px;text-align:center;margin:0;">Pesanan selesai otomatis 3 hari setelah pengiriman jika tidak ada komplain.</p>
  `);
}

// ─── Template 5: Karya lolos kurasi → Seller ─────────────────────────────────
export function buildProductCuratedEmail(productName: string, productSlug: string) {
  return emailLayout(`
    ${badge("✅ Karya Lolos Kurasi!", "#1A5E2A", "#FFFFFF")}
    <p style="color:#EDE8DE;font-size:14px;margin:0 0 24px;line-height:1.6;">Selamat! Karya Anda telah melalui proses kurasi tim MajaCraft dan dinyatakan lolos. Karya Anda kini tampil dengan badge <strong style="color:#C9A84C;">Terverifikasi</strong> di marketplace.</p>
    ${infoCard([{ label: "Karya", value: productName, gold: true }])}
    ${ctaButton("Lihat Karya di Marketplace →", `${BASE_URL}/produk/${productSlug}`)}
    <p style="color:#8A7A62;font-size:12px;text-align:center;margin:0;">Terima kasih telah menjadi bagian dari komunitas seniman MajaCraft.</p>
  `);
}

// ─── Template 6: Karya ditolak kurasi → Seller ───────────────────────────────
export function buildProductRejectedEmail(productName: string, reason: string) {
  return emailLayout(`
    ${badge("⚠️ Karya Perlu Diperbaiki", "#7C2D12", "#FFFFFF")}
    <p style="color:#EDE8DE;font-size:14px;margin:0 0 20px;line-height:1.6;">Karya Anda belum lolos proses kurasi. Silakan lakukan perbaikan dan upload ulang.</p>
    ${infoCard([
      { label: "Karya", value: productName },
      ...(reason ? [{ label: "Catatan Kurator", value: reason }] : []),
    ])}
    ${ctaButton("Perbaiki &amp; Upload Ulang →", `${BASE_URL}/studio`)}
    <p style="color:#8A7A62;font-size:12px;text-align:center;margin:0;">Jika ada pertanyaan, hubungi kami di halo@majacraft.id</p>
  `);
}

// ─── Template 7: Status pencairan → Seller ───────────────────────────────────
export function buildWithdrawalEmail(
  netAmount: number,
  status: "APPROVED" | "REJECTED" | "TRANSFERRED",
  adminNote?: string
) {
  const config = {
    APPROVED: {
      badge: badge("✅ Pencairan Disetujui!", "#1A5E2A", "#FFFFFF"),
      msg: "Pengajuan pencairan dana Anda telah disetujui. Dana akan segera ditransfer ke rekening Anda.",
    },
    REJECTED: {
      badge: badge("⚠️ Pencairan Ditolak", "#7C2D12", "#FFFFFF"),
      msg: "Pengajuan pencairan dana Anda tidak dapat diproses saat ini.",
    },
    TRANSFERRED: {
      badge: badge("💰 Dana Telah Ditransfer!", "#1A5E2A", "#FFFFFF"),
      msg: "Dana pencairan Anda telah berhasil ditransfer ke rekening yang terdaftar. Mohon cek mutasi rekening dalam 1×24 jam.",
    },
  };
  const c = config[status];

  return emailLayout(`
    ${c.badge}
    <p style="color:#EDE8DE;font-size:14px;margin:0 0 24px;line-height:1.6;">${c.msg}</p>
    ${infoCard([
      { label: "Jumlah", value: `Rp ${netAmount.toLocaleString("id-ID")}`, gold: true },
      { label: "Status", value: status === "APPROVED" ? "Disetujui" : status === "REJECTED" ? "Ditolak" : "Sudah Ditransfer" },
      ...(adminNote ? [{ label: "Catatan Admin", value: adminNote }] : []),
    ])}
    ${ctaButton("Lihat Riwayat Pencairan →", `${BASE_URL}/studio`)}
    ${status === "TRANSFERRED" ? `<p style="color:#8A7A62;font-size:12px;text-align:center;margin:0;">Jika dana belum diterima dalam 1×24 jam, hubungi halo@majacraft.id</p>` : ""}
  `);
}
