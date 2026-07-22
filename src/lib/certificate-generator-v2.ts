/**
 * MAJA Certificate Generator v2 – Dark Gold Landscape
 * Background : background-nft.png  (1536 × 1024 px)
 * Hologram   : hologram-sertifikat.png
 *
 * Layout:
 *   Photo frame (inner black) : L=117, T=245, W=515, H=512, B=757
 *   Text rows (info area)     : 8 rows, WORK NAME 2-baris + 7 single
 *   QR + Hologram             : bottom right, same height (174px)
 *   Certificate ID            : below frame, dark brown bold
 */

import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// ─── DIMENSI ─────────────────────────────────────────────────────────────────
const W = 1536;
const H = 1024;

// Frame inner black area (measured from bg pixel scan)
const FRAME_L = 117;
const FRAME_T = 245;
const FRAME_W = 515;
const FRAME_H = 512;
const FRAME_B = FRAME_T + FRAME_H;   // 757
const FRAME_R = 632;                  // outer right edge

// ─── TEXT LAYOUT ─────────────────────────────────────────────────────────────
const ICON_X  = FRAME_R + 48;        // 680 — gap from frame right
const LABEL_X = ICON_X + 32;         // 712
const COLON_X = 924;
const VALUE_X = 946;

const TEXT_T   = FRAME_T;            // rows start at frame top
const ROW_H_WN = 70;                 // work name (2 lines): 70 + 7×63 = 511 ≈ FRAME_H
const ROW_H    = 63;
const BY       = 43;                 // baseline offset for single-line rows

const LABEL_FONT = 22;
const VALUE_FONT = 22;

// ─── COLORS ──────────────────────────────────────────────────────────────────
const UNIFIED = "#4A2200";           // one brown for icons + labels + values
const LC      = UNIFIED;
const VC      = UNIFIED;
const DC      = "#8A6020";           // divider line
const ID_COLOR = "#1A0A00";          // cert ID (darker for contrast)
const QRC      = "#0D0500";          // near-black QR for best scannability

// ─── QR + HOLOGRAM ───────────────────────────────────────────────────────────
const QR_SIZE  = 174;
const QR_T     = FRAME_B + 28;       // 785
const QR_L     = W - 110 - QR_SIZE;  // 1252
const HOLO_H   = 174;
const HOLO_W   = Math.round(HOLO_H * (1578 / 997));   // ~276
const HOLO_T   = QR_T;
const HOLO_L   = QR_L - 18 - HOLO_W;

// Certificate ID area (below frame)
const PROD_ID_X  = FRAME_L + Math.round(FRAME_W / 2);  // 374
const CERT_LBL_Y = FRAME_B + 38;                        // 795
const PROD_ID_Y  = FRAME_B + 82;                        // 839

// ─── PATHS ───────────────────────────────────────────────────────────────────
const CERT_DIR   = path.join(process.cwd(), "public", "uploads", "certificates");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const BG_PATH    = path.join(PUBLIC_DIR, "images", "background-nft.png");
const HOLO_PATH  = path.join(PUBLIC_DIR, "images", "hologram-sertifikat.png");

// ─── INTERFACES ──────────────────────────────────────────────────────────────
export interface CertDataV2 {
  certificateId: string;
  productName: string;
  material?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  origin?: string | null;
  sellerName: string;
  sellerStore: string;
  studioName?: string | null;
  issuedAt: Date;
}

export interface GenerateCertificateV2Params {
  data: CertDataV2;
  productImagePath?: string | null;
  verifyBaseUrl?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ensureCertDir() {
  if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function trunc(s: string, n: number): string {
  return s && s.length > n ? s.slice(0, n - 1) + "…" : s || "-";
}
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── ICONS (SVG outline, brownish, consistent stroke) ────────────────────────
function iconSvg(type: string, cx: number, cy: number): string {
  const s = LC, sw = "2", op = "0.85";
  switch (type) {
    case "vase":
      return `<ellipse cx="${cx}" cy="${cy-9}" rx="8" ry="5" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<path d="M${cx-8} ${cy-5} Q${cx-13} ${cy+2} ${cx-7} ${cy+10} L${cx+7} ${cy+10} Q${cx+13} ${cy+2} ${cx+8} ${cy-5}" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<line x1="${cx-7}" y1="${cy+10}" x2="${cx+7}" y2="${cy+10}" stroke="${s}" stroke-width="2.2" opacity="${op}"/>
<ellipse cx="${cx}" cy="${cy-2}" rx="10" ry="3.5" fill="none" stroke="${s}" stroke-width="1" opacity="0.4"/>`;
    case "gem":
      return `<polygon points="${cx},${cy-13} ${cx+11},${cy-3} ${cx+7},${cy+10} ${cx-7},${cy+10} ${cx-11},${cy-3}" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<line x1="${cx-11}" y1="${cy-3}" x2="${cx+11}" y2="${cy-3}" stroke="${s}" stroke-width="1.2" opacity="0.45"/>
<line x1="${cx}" y1="${cy-13}" x2="${cx}" y2="${cy+10}" stroke="${s}" stroke-width="0.9" opacity="0.35"/>`;
    case "ruler":
      return `<rect x="${cx-12}" y="${cy-5}" width="24" height="10" rx="2.5" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<line x1="${cx-6}" y1="${cy-8}" x2="${cx-6}" y2="${cy+8}" stroke="${s}" stroke-width="1.4" opacity="0.5"/>
<line x1="${cx}" y1="${cy-8}" x2="${cx}" y2="${cy+8}" stroke="${s}" stroke-width="1.4" opacity="0.5"/>
<line x1="${cx+6}" y1="${cy-8}" x2="${cx+6}" y2="${cy+8}" stroke="${s}" stroke-width="1.4" opacity="0.5"/>`;
    case "scale":
      return `<line x1="${cx-12}" y1="${cy-2}" x2="${cx+12}" y2="${cy-2}" stroke="${s}" stroke-width="2.2" opacity="${op}"/>
<line x1="${cx}" y1="${cy-10}" x2="${cx}" y2="${cy+9}" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<path d="M${cx-12} ${cy-2} L${cx-15} ${cy+5} L${cx-9} ${cy+5} Z" fill="none" stroke="${s}" stroke-width="1.6" opacity="0.6"/>
<path d="M${cx+12} ${cy-2} L${cx+15} ${cy+5} L${cx+9} ${cy+5} Z" fill="none" stroke="${s}" stroke-width="1.6" opacity="0.6"/>
<line x1="${cx-5}" y1="${cy-10}" x2="${cx+5}" y2="${cy-10}" stroke="${s}" stroke-width="1.6" opacity="0.6"/>`;
    case "pin":
      return `<circle cx="${cx}" cy="${cy-6}" r="7" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<circle cx="${cx}" cy="${cy-6}" r="2.5" fill="${s}" opacity="0.7"/>
<path d="M${cx-6} ${cy-2} Q${cx-5} ${cy+5} ${cx} ${cy+13} Q${cx+5} ${cy+5} ${cx+6} ${cy-2}" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`;
    case "person":
      return `<circle cx="${cx}" cy="${cy-8}" r="6" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<path d="M${cx-11} ${cy+12} Q${cx-10} ${cy-1} ${cx} ${cy-1} Q${cx+10} ${cy-1} ${cx+11} ${cy+12}" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`;
    case "building":
      return `<rect x="${cx-12}" y="${cy-1}" width="24" height="12" rx="1" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<rect x="${cx-9}" y="${cy+2}" width="5" height="9" fill="${s}" opacity="0.28"/>
<rect x="${cx+4}" y="${cy+2}" width="5" height="9" fill="${s}" opacity="0.28"/>
<rect x="${cx-14}" y="${cy-5}" width="28" height="4" rx="1" fill="${s}" opacity="0.55"/>
<polygon points="${cx-10},${cy-5} ${cx},${cy-15} ${cx+10},${cy-5}" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`;
    case "calendar":
      return `<rect x="${cx-12}" y="${cy-6}" width="24" height="18" rx="2.5" fill="none" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>
<line x1="${cx-12}" y1="${cy-1}" x2="${cx+12}" y2="${cy-1}" stroke="${s}" stroke-width="1.6" opacity="0.55"/>
<rect x="${cx-8}" y="${cy+4}" width="5" height="5" rx="1" fill="${s}" opacity="0.4"/>
<rect x="${cx+3}" y="${cy+4}" width="5" height="5" rx="1" fill="${s}" opacity="0.4"/>
<line x1="${cx-6}" y1="${cy-9}" x2="${cx-6}" y2="${cy-4}" stroke="${s}" stroke-width="2.2" opacity="0.68"/>
<line x1="${cx+6}" y1="${cy-9}" x2="${cx+6}" y2="${cy-4}" stroke="${s}" stroke-width="2.2" opacity="0.68"/>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="7" fill="${s}" opacity="0.75"/>`;
  }
}

// ─── SVG ROW ─────────────────────────────────────────────────────────────────
function rowSvg(
  iconType: string, lbl: string, val: string,
  rowY: number, rowH: number, showDiv: boolean, isWN: boolean
): string {
  const divY   = rowY + rowH - 4;
  const iconCY = isWN ? rowY + 40 : rowY + Math.round(rowH / 2);

  let textPart: string;
  if (isWN) {
    const cut = val.length > 26 ? val.lastIndexOf(" ", 26) : val.length;
    const at  = cut > 0 ? cut : 26;
    const l1  = val.slice(0, at);
    const l2  = val.length > at ? val.slice(at + 1).trim() : null;
    const by1 = rowY + 38;
    const by2 = rowY + 38 + VALUE_FONT + 4;
    textPart =
      `<text x="${LABEL_X}" y="${by1}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" letter-spacing="3" font-weight="800">${esc(lbl)}</text>` +
      `<text x="${COLON_X}" y="${by1}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" font-weight="800">:</text>` +
      `<text x="${VALUE_X}" y="${by1}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(l1, 30))}</text>` +
      (l2 ? `<text x="${VALUE_X}" y="${by2}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(l2, 30))}</text>` : "");
  } else {
    const baseY = rowY + BY;
    textPart =
      `<text x="${LABEL_X}" y="${baseY}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" letter-spacing="3" font-weight="800">${esc(lbl)}</text>` +
      `<text x="${COLON_X}" y="${baseY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" font-weight="800">:</text>` +
      `<text x="${VALUE_X}" y="${baseY}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(val, 32))}</text>`;
  }

  return `<g>${iconSvg(iconType, ICON_X, iconCY)}${textPart}${
    showDiv ? `<line x1="${LABEL_X}" y1="${divY}" x2="${W - 44}" y2="${divY}" stroke="${DC}" stroke-width="0.9" opacity="0.24"/>` : ""
  }</g>`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export async function generateCertificateImageV2(
  params: GenerateCertificateV2Params
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

  // 2. Product photo fitted into inner black frame
  if (productImagePath) {
    try {
      const src = productImagePath.startsWith("/")
        ? path.join(PUBLIC_DIR, productImagePath)
        : productImagePath;
      if (fs.existsSync(src)) {
        const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W}" height="${FRAME_H}">
          <rect width="${FRAME_W}" height="${FRAME_H}" rx="8" ry="8" fill="white"/>
        </svg>`;
        const mask   = Buffer.from(maskSvg);
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
      console.error("[cert-v2] photo error:", e);
    }
  }

  // 3. Info rows SVG overlay
  const rows: Array<[string, string, string, boolean]> = [
    ["vase",    "WORK NAME",   data.productName,                          true],
    ["gem",     "MATERIAL",    data.material    ?? "-",                   false],
    ["ruler",   "DIMENSIONS",  data.dimensions  ?? "-",                   false],
    ["scale",   "WEIGHT",      data.weight      ?? "-",                   false],
    ["pin",     "ORIGIN AREA", data.origin      ?? "-",                   false],
    ["person",  "ARTISAN",     data.sellerName,                           false],
    ["building","STUDIO",      data.studioName  ?? data.sellerStore ?? "-", false],
    ["calendar","RELEASE DATE",formatDate(data.issuedAt),                 false],
  ];

  const rowsSvg = rows.map(([ico, lbl, val, wn], i) => {
    const rowY = i === 0 ? TEXT_T : TEXT_T + ROW_H_WN + (i - 1) * ROW_H;
    const rowH = i === 0 ? ROW_H_WN : ROW_H;
    return rowSvg(ico, lbl, val, rowY, rowH, i < rows.length - 1, wn);
  }).join("");

  const certId = data.certificateId.replace("MAJA-", "#MC-");
  const certIdSvg =
    `<text x="${PROD_ID_X}" y="${CERT_LBL_Y}" text-anchor="middle"` +
    ` font-family="Arial,Helvetica,sans-serif" font-size="22" fill="${ID_COLOR}"` +
    ` font-weight="800" letter-spacing="6" opacity="0.95">CERTIFICATE ID</text>` +
    `<text x="${PROD_ID_X}" y="${PROD_ID_Y}" text-anchor="middle"` +
    ` font-family="Courier New,Courier,monospace" font-size="38" fill="${ID_COLOR}"` +
    ` font-weight="700" letter-spacing="1.5" opacity="1.0">${esc(certId)}</text>`;

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${rowsSvg}${certIdSvg}</svg>`;

  base = await sharp(base)
    .composite([{ input: Buffer.from(fullSvg), blend: "over" }])
    .png()
    .toBuffer();

  // 4. QR code (near-black, transparent bg)
  const qrBuf = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 1,
    color: { dark: QRC, light: "#00000000" },
  });
  base = await sharp(base)
    .composite([{ input: qrBuf, left: QR_L, top: QR_T }])
    .png()
    .toBuffer();

  // 5. Hologram + short ID text
  if (fs.existsSync(HOLO_PATH)) {
    try {
      const holoImg = await sharp(HOLO_PATH)
        .resize(HOLO_W, HOLO_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      base = await sharp(base)
        .composite([{ input: holoImg, left: HOLO_L, top: HOLO_T }])
        .png()
        .toBuffer();

      // Short ID on hologram (last segment of cert ID, e.g. "A1B2C3D4E5F6")
      const shortId   = data.certificateId.split("-").slice(2).join("");
      const holoCX    = HOLO_L + Math.round(HOLO_W / 2);
      const holoTxtY  = HOLO_T + HOLO_H - 16;
      const holoTxtSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
        `<text x="${holoCX}" y="${holoTxtY}" text-anchor="middle"` +
        ` font-family="Courier New,Courier,monospace" font-size="17" fill="#C8A030"` +
        ` font-weight="700" letter-spacing="2.5" opacity="0.90">${esc(shortId)}</text>` +
        `</svg>`;
      base = await sharp(base)
        .composite([{ input: Buffer.from(holoTxtSvg), blend: "over" }])
        .png()
        .toBuffer();
    } catch (e) {
      console.error("[cert-v2] hologram error:", e);
    }
  }

  await sharp(base).toFile(outputPath);
  return `/uploads/certificates/${data.certificateId}.png`;
}
