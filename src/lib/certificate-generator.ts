/**
 * MAJA Certificate Generator v7 – Landscape
 * Background: bg-nft-new.png  (2344 × 1462 px)
 *
 * Layout (koordinat native):
 *   Photo frame  : L=112,  T=365,  W=869,  H=865
 *   Product ID   : centerX=546,  Y=1302  (bawah frame foto)
 *   Text rows    : 3-column table — LABEL_X / COLON_X / VALUE_X
 *   8 rows       : WORK NAME(158px) + 7 others(101px each) = 865px = FRAME_H ✓
 *   QR code      : T=1230 (=frame bottom), shifted left
 *   Hologram     : kiri QR, top sejajar frame bottom
 */

import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// ─── DIMENSI ────────────────────────────────────────────────────────────────
const W = 2344;
const H = 1462;

// Photo frame
const FRAME_L = 112;
const FRAME_T = 365;
const FRAME_W = 869;
const FRAME_H = 865;
const FRAME_R = 25;

// ── 3-column text layout ──────────────────────────────────────────────────
// Kolom 1: label  left-align  @ LABEL_X
// Kolom 2: titik dua          @ COLON_X (fixed — semua ":" sejajar vertikal)
// Kolom 3: value  left-align  @ VALUE_X
const TEXT_T   = FRAME_T;   // 365 – mulai tepat di atas frame foto
const LABEL_X  = 1040;      // label left-align
const COLON_X  = 1415;      // ":" selalu di X ini
const VALUE_X  = 1452;      // value mulai dari sini
const BY       = 72;        // baseline offset dalam row

// Row heights – 8 rows: 158 + 7×101 = 865 = FRAME_H ✓
const ROW_H_WN = 158;  // work name (alokasi 2 baris)
const ROW_H    = 101;  // baris lainnya

// Font sizes
const LABEL_FONT = 38;
const VALUE_FONT = 50;

// ── QR + Hologram ──────────────────────────────────────────────────────────
// QR: mulai tepat di bawah divider STUDIO (row 5), besar & transparan
const STUDIO_ROW_Y  = FRAME_T + ROW_H_WN + 5 * ROW_H;              // 1028
const QR_SIZE       = 280;
const QR_T          = STUDIO_ROW_Y + ROW_H - 8;                     // 1121 (bawah divider STUDIO)
const QR_L          = W - 50 - QR_SIZE;                             // 2014
const HOLO_H_CONST  = 160;
const HOLO_W_CONST  = Math.round(HOLO_H_CONST * (1333 / 690));      // 309
const HOLO_TOP      = QR_T + QR_SIZE - HOLO_H_CONST;               // 1241 (align bottom with QR)
const HOLO_LEFT     = QR_L - 20 - HOLO_W_CONST;                    // 1685

// Product ID – di bawah frame foto
const PROD_ID_X = FRAME_L + Math.round(FRAME_W / 2);  // 546
const PROD_ID_Y = FRAME_T + FRAME_H + 72;              // 1302

// Colors
const LABEL_COLOR = "#5A3200";
const VALUE_COLOR = "#1A0800";
const ID_COLOR    = "#3D2200";
const DIV_COLOR   = "#7A5500";
const QR_DARK     = "#3D1500";  // warna QR menyatu dengan card

const CERT_DIR   = path.join(process.cwd(), "public", "uploads", "certificates");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const BG_PATH    = path.join(PUBLIC_DIR, "images", "bg-nft-new.png");
const HOLO_PATH  = path.join(PUBLIC_DIR, "images", "hologram-nft.png");

// ─── HELPERS ────────────────────────────────────────────────────────────────

function ensureCertDir() {
  if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
}
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
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
  studioName?: string | null;
}

export interface GenerateCertificateParams {
  data: CertData;
  productImagePath?: string | null;
  verifyBaseUrl?: string;
}

// ─── TEXT OVERLAY ────────────────────────────────────────────────────────────

function textSvg(data: CertData): string {
  const productId = data.certificateId.replace("MAJA-", "#MC-");

  // Wrap work name – always allocates 2-line height (ROW_H_WN=215)
  function wrapAt(text: string, max: number): [string, string | null] {
    if (text.length <= max) return [text, null];
    const cut = text.lastIndexOf(" ", max);
    const at = cut > 0 ? cut : max;
    return [text.slice(0, at), text.slice(at + 1).trim() || null];
  }
  const [wn1, wn2] = wrapAt(data.productName ?? "-", 26);

  const otherRows: Array<[string, string]> = [
    ["MATERIAL",     data.material ?? "-"],
    ["DIMENSIONS",   data.dimensions ?? "-"],
    ["WEIGHT",       data.weight ?? "-"],
    ["ORIGIN AREA",  data.origin ?? "-"],
    ["ARTISAN",      data.sellerName ?? "-"],
    ["STUDIO",       data.studioName ?? data.sellerStore ?? "-"],
    ["RELEASE DATE", data.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
  ];

  // Helper: satu row — label left-align, ":" fixed X, value left-align + bold
  function rowSvg(lbl: string, val: string, rowY: number, showDiv: boolean): string {
    const baseY = rowY + BY;
    const divY  = rowY + ROW_H - 8;
    return [
      `<text x="${LABEL_X}" y="${baseY}" text-anchor="start"`,
      `  font-family="'Arial Narrow',Arial,sans-serif"`,
      `  font-size="${LABEL_FONT}" fill="${LABEL_COLOR}" letter-spacing="4" font-weight="700">${esc(lbl)}</text>`,
      `<text x="${COLON_X}" y="${baseY}" text-anchor="middle"`,
      `  font-family="'Arial Narrow',Arial,sans-serif"`,
      `  font-size="${LABEL_FONT}" fill="${LABEL_COLOR}" font-weight="700">:</text>`,
      `<text x="${VALUE_X}" y="${baseY}" text-anchor="start"`,
      `  font-family="Arial,Helvetica,sans-serif"`,
      `  font-size="${VALUE_FONT}" fill="${VALUE_COLOR}" font-weight="600">${esc(trunc(val, 26))}</text>`,
      showDiv
        ? `<line x1="${LABEL_X}" y1="${divY}" x2="${W - 62}" y2="${divY}" stroke="${DIV_COLOR}" stroke-width="1.8" opacity="0.30"/>`
        : "",
    ].join("\n");
  }

  // ── Product ID – di bawah frame foto ──
  const productIdSvg = [
    `<text x="${PROD_ID_X}" y="${PROD_ID_Y}"`,
    `  text-anchor="middle"`,
    `  font-family="'Courier New',Courier,monospace"`,
    `  font-size="64" fill="${ID_COLOR}" font-weight="700" letter-spacing="2">${esc(productId)}</text>`,
  ].join("\n");

  // ── WORK NAME row ──
  const wnY    = TEXT_T;
  const wnBy1  = wnY + BY;
  const wnBy2  = wnY + BY + VALUE_FONT + 8;
  const wnDivY = wnY + ROW_H_WN - 8;
  const workNameSvg = [
    `<text x="${LABEL_X}" y="${wnBy1}" text-anchor="start"`,
    `  font-family="'Arial Narrow',Arial,sans-serif"`,
    `  font-size="${LABEL_FONT}" fill="${LABEL_COLOR}" letter-spacing="4" font-weight="700">WORK NAME</text>`,
    `<text x="${COLON_X}" y="${wnBy1}" text-anchor="middle"`,
    `  font-family="'Arial Narrow',Arial,sans-serif"`,
    `  font-size="${LABEL_FONT}" fill="${LABEL_COLOR}" font-weight="700">:</text>`,
    `<text x="${VALUE_X}" y="${wnBy1}" text-anchor="start"`,
    `  font-family="Arial,Helvetica,sans-serif"`,
    `  font-size="${VALUE_FONT}" fill="${VALUE_COLOR}" font-weight="600">${esc(trunc(wn1, 30))}</text>`,
    wn2
      ? `<text x="${VALUE_X}" y="${wnBy2}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VALUE_COLOR}" font-weight="600">${esc(trunc(wn2, 30))}</text>`
      : "",
    `<line x1="${LABEL_X}" y1="${wnDivY}" x2="${W - 62}" y2="${wnDivY}" stroke="${DIV_COLOR}" stroke-width="1.8" opacity="0.30"/>`,
  ].join("\n");

  // ── Other rows – mulai tepat setelah WORK NAME (TEXT_T + ROW_H_WN) ──
  const otherStartY = TEXT_T + ROW_H_WN;  // 365 + 158 = 523

  const otherSvg = otherRows
    .map(([lbl, val], i) => {
      const rowY  = otherStartY + i * ROW_H;
      const isLast = i === otherRows.length - 1;
      return rowSvg(lbl, val, rowY, !isLast);
    })
    .join("\n");

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

// ─── MAIN ────────────────────────────────────────────────────────────────────

export async function generateCertificateImage(
  params: GenerateCertificateParams
): Promise<string> {
  ensureCertDir();

  const { data, productImagePath, verifyBaseUrl = "https://majacraft.id" } = params;
  const verifyUrl  = `${verifyBaseUrl}/verifikasi/${data.certificateId}`;
  const outputPath = path.join(CERT_DIR, `${data.certificateId}.png`);

  // 1. Background
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
        const mask   = Buffer.from(roundedRectMask(FRAME_W, FRAME_H, FRAME_R));
        const photo  = await sharp(src)
          .resize(FRAME_W, FRAME_H, { fit: "cover", position: "center" })
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

  // 4. QR code — transparan, warna dark brown menyatu dengan card
  const qrBuf = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 1,
    color: { dark: QR_DARK, light: "#00000000" },
  });
  base = await sharp(base)
    .composite([{ input: qrBuf, left: QR_L, top: QR_T }])
    .png()
    .toBuffer();

  // 5. Hologram
  if (fs.existsSync(HOLO_PATH)) {
    try {
      const holoImg = await sharp(HOLO_PATH)
        .resize(HOLO_W_CONST, HOLO_H_CONST, {  // ~309 × 160
          fit: "contain",
          position: "center",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      base = await sharp(base)
        .composite([{ input: holoImg, left: HOLO_LEFT, top: HOLO_TOP }])
        .png()
        .toBuffer();
    } catch (e) {
      console.error("[cert-gen] hologram error:", e);
    }
  }

  await sharp(base).toFile(outputPath);
  return `/uploads/certificates/${data.certificateId}.png`;
}
