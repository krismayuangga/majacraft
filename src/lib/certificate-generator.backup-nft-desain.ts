/**
 * MAJA Certificate Generator v4
 * Background: nft-desain-maja.png (403×619 scaled 2x → 806×1238)
 *
 * Layout (koordinat at 2x):
 *   Frame foto  : L=144, T=246, W=524, H=410, corner-radius=40
 *   Text area   : start Y=690, left=56, value-col=298, row-height=52
 *   QR barcode  : x=56, y=1012, size=140px (sejajar hologram circles)
 */

import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// ─── DIMENSI (2x dari 403×619) ────────────────────────────────────────────
const W = 806;
const H = 1238;

// Frame foto (dark rounded rectangle di background)
// Dari pixel scan: inner top y=125(1x)=250(2x), inner bottom y=325(1x)=650(2x)
const FRAME_L  = 198;  // at 2x (x=99 at 1x)
const FRAME_T  = 250;  // at 2x — tepat di inner frame top
const FRAME_W  = 412;  // at 2x (305-99=206*2)
const FRAME_H  = 390;  // at 2x — sedikit lebih kecil dari inner (390 < 400) agar frame glow terlihat di bawah
const FRAME_R  = 22;   // corner radius

// Text metadata — TEXT_L sejajar dengan batas kiri foto (FRAME_L=198)
const TEXT_L   = 198;  // label X — sejajar sisi kiri foto
const TEXT_V   = 390;  // value X
// FRAME_T(250)+FRAME_H(390)=640; glow bottom ~660; PRODUCT_ID y=694; divider 704; text dari 714
const TEXT_T   = 714;  // start Y
const TEXT_ROW = 33;   // lebih rapat — 7 rows×33=231px end at ~968, QR at 991

// QR barcode — center di y=1066 (hologram circle center at 2x)
// Hologram kiri x=338 at 2x; center QR di ruang tersisa: (338-130)/2+10=109 → 130
const QR_L    = 110;
const QR_T    = 991;   // center = 991+75 = 1066 = hologram center
const QR_SIZE = 150;   // diperbesar agar setinggi hologram

const CERT_DIR  = path.join(process.cwd(), "public", "uploads", "certificates");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const BG_PATH   = path.join(PUBLIC_DIR, "images", "nft-desain-maja.png");

const GOLD      = "#C9A84C";
const GOLD_L    = "#E8C870";
const TXT_WHITE = "#F0EAD8";
const TXT_MUTED = "#A89A78";

// ─── HELPERS ──────────────────────────────────────────────────────────────

function ensureCertDir() {
  if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
}
function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n-1)+"…" : s;
}

// ─── INTERFACES ───────────────────────────────────────────────────────────

export interface CertData {
  certificateId: string;
  productName: string;
  material?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  origin?: string | null;
  sellerName: string;
  sellerStore: string;
  issuedAt: Date;
  buyerName?: string | null;
}

export interface GenerateCertificateParams {
  data: CertData;
  productImagePath?: string | null;
  verifyBaseUrl?: string;
}

// ─── TEXT OVERLAY ─────────────────────────────────────────────────────────

function textSvg(data: CertData): string {
  const productId = data.certificateId.replace("MAJA-", "#MC-");

  // WORK NAME wrap helper
  function wrapAt(text: string, max: number): [string, string | null] {
    if (text.length <= max) return [text, null];
    const cut = text.lastIndexOf(" ", max);
    const at = cut > 0 ? cut : max;
    return [text.slice(0, at), text.slice(at + 1).trim() || null];
  }

  const [wn1, wn2] = wrapAt(data.productName ?? "-", 24);
  const workNameExtraRow = wn2 ? 1 : 0; // extra row jika wrap

  // Build rows dengan dynamic Y
  const otherRows: Array<[string, string]> = [
    ["MATERIAL",    data.material ?? "-"],
    ["DIMENSIONS",  data.dimensions ?? "-"],
    ["WEIGHT",      data.weight ?? "-"],
    ["ORIGIN AREA", data.origin ?? data.sellerStore ?? "-"],
    ["ARTISAN",     data.sellerName ?? "-"],
  ];

  // WORK NAME row
  const wnY = TEXT_T;
  const workNameSvg = [
    `<text x="${TEXT_L}" y="${wnY + 23}"`,
    `  font-family="'Arial Narrow',Arial,sans-serif"`,
    `  font-size="15" fill="${TXT_MUTED}" letter-spacing="2.5" font-weight="700">WORK NAME:</text>`,
    `<text x="${TEXT_V}" y="${wnY + 23}"`,
    `  font-family="Arial,Helvetica,sans-serif"`,
    `  font-size="17" fill="${TXT_WHITE}" font-weight="300">${esc(wn1)}</text>`,
    wn2
      ? `<text x="${TEXT_V}" y="${wnY + 23 + 18}" font-family="Arial,Helvetica,sans-serif" font-size="17" fill="${TXT_WHITE}" font-weight="300">${esc(trunc(wn2, 28))}</text>`
      : "",
    `<line x1="${TEXT_L}" y1="${wnY + TEXT_ROW * (1 + workNameExtraRow) - 5}" x2="${W - TEXT_L}" y2="${wnY + TEXT_ROW * (1 + workNameExtraRow) - 5}"`,
    `  stroke="${GOLD}" stroke-width="0.5" opacity="0.18"/>`,
  ].join("\n");

  // Other rows
  const otherSvg = otherRows.map(([lbl, val], i) => {
    const y = TEXT_T + (1 + workNameExtraRow + i) * TEXT_ROW;
    const isLast = i === otherRows.length - 1;
    const div = !isLast
      ? `<line x1="${TEXT_L}" y1="${y + TEXT_ROW - 5}" x2="${W - TEXT_L}" y2="${y + TEXT_ROW - 5}" stroke="${GOLD}" stroke-width="0.5" opacity="0.18"/>`
      : "";
    return [
      `<text x="${TEXT_L}" y="${y + 23}" font-family="'Arial Narrow',Arial,sans-serif" font-size="15" fill="${TXT_MUTED}" letter-spacing="2.5" font-weight="700">${esc(lbl)}:</text>`,
      `<text x="${TEXT_V}" y="${y + 23}" font-family="Arial,Helvetica,sans-serif" font-size="17" fill="${TXT_WHITE}" font-weight="300">${esc(trunc(val, 28))}</text>`,
      div,
    ].join("\n");
  }).join("\n");

  // PRODUCT ID — frame photo bottom=640, glow ~660, ID di y=694 (34px bawah foto)
  const productIdSvg = [
    `<text x="${W / 2}" y="694"`,
    `  text-anchor="middle"`,
    `  font-family="Arial,Helvetica,sans-serif"`,
    `  font-size="21" fill="${GOLD_L}" font-weight="500" letter-spacing="1.5">${esc(productId)}</text>`,
    `<line x1="${W / 2 - 190}" y1="704" x2="${W / 2 + 190}" y2="704"`,
    `  stroke="${GOLD}" stroke-width="0.6" opacity="0.35"/>`,
  ].join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${productIdSvg}
    ${workNameSvg}
    ${otherSvg}
  </svg>`;
}

// ─── ROUNDED RECT MASK (untuk foto) ───────────────────────────────────────

function roundedRectMask(w: number, h: number, r: number): string {
  // SVG rounded rect path
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
  </svg>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

export async function generateCertificateImage(
  params: GenerateCertificateParams
): Promise<string> {
  ensureCertDir();

  const { data, productImagePath, verifyBaseUrl = "https://majacraft.id" } = params;
  const verifyUrl  = `${verifyBaseUrl}/verifikasi/${data.certificateId}`;
  const outputPath = path.join(CERT_DIR, `${data.certificateId}.png`);

  // 1. Background (scale 2x)
  let base = await sharp(BG_PATH)
    .resize(W, H, { fit: "fill", kernel: "lanczos3" })
    .png()
    .toBuffer();

  // 2. Foto produk dalam rounded rect frame
  if (productImagePath) {
    try {
      const src = productImagePath.startsWith("/")
        ? path.join(PUBLIC_DIR, productImagePath)
        : productImagePath;

      if (fs.existsSync(src)) {
        const mask = Buffer.from(roundedRectMask(FRAME_W, FRAME_H, FRAME_R));

        const photo = await sharp(src)
          .resize(FRAME_W, FRAME_H, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        const masked = await sharp(photo)
          .composite([{ input: mask, blend: "dest-in" }])
          .png()
          .toBuffer();

        base = await sharp(base)
          .composite([{ input: masked, left: FRAME_L, top: FRAME_T }])
          .png()
          .toBuffer();
      }
    } catch (e) {
      console.error("[cert-gen] photo error:", e);
    }
  }

  // 3. Text metadata overlay
  base = await sharp(base)
    .composite([{ input: Buffer.from(textSvg(data)), blend: "over" }])
    .png()
    .toBuffer();

  // 4. QR code (bottom-left, sejajar hologram circles)
  const qrBuf = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 1,
    color: { dark: "000000", light: "FFFFFF" },
  });

  // White background pad untuk QR
  const qrBg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect x="${QR_L-5}" y="${QR_T-5}" width="${QR_SIZE+10}" height="${QR_SIZE+10}"
            fill="white" rx="6" ry="6"/>
    </svg>`
  );

  base = await sharp(base)
    .composite([
      { input: qrBg,  blend: "over" },
      { input: qrBuf, left: QR_L, top: QR_T },
    ])
    .png()
    .toBuffer();

  await sharp(base).toFile(outputPath);
  return `/uploads/certificates/${data.certificateId}.png`;
}
