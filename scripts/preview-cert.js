// Preview script – certificate layout v8 (divider visible, QR transparent+besar)
const sharp   = require('sharp');
const QRCode  = require('qrcode');
const path    = require('path');
const fs      = require('fs');

const W = 2344, H = 1462;
const FRAME_L = 112, FRAME_T = 365, FRAME_W = 869, FRAME_H = 865;

const TEXT_T   = FRAME_T;         // 365
const LABEL_X  = 1040;
const COLON_X  = 1415;
const VALUE_X  = 1452;
const BY       = 72;
const ROW_H_WN = 158;
const ROW_H    = 101;
const LABEL_FONT = 38, VALUE_FONT = 50;
const LC = '#5A3200', VC = '#1A0800', IC = '#3D2200', DC = '#7A5500';
const QR_DARK  = '#3D1500';

// QR besar mulai di bawah divider STUDIO (row 5)
const STUDIO_ROW_Y  = FRAME_T + ROW_H_WN + 5 * ROW_H;   // 1028
const QR_SIZE       = 280;
const QR_T          = STUDIO_ROW_Y + ROW_H - 8;          // 1121
const QR_L          = W - 50 - QR_SIZE;                  // 2014
const HOLO_H        = 160;
const HOLO_W        = Math.round(HOLO_H * (1333/690));   // 309
const HOLO_TOP      = QR_T + QR_SIZE - HOLO_H;           // 1241
const HOLO_LEFT     = QR_L - 20 - HOLO_W;               // 1685

const PROD_ID_X = FRAME_L + Math.round(FRAME_W / 2);     // 546
const PROD_ID_Y = FRAME_T + FRAME_H + 72;                // 1302

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const BG        = path.join(PUBLIC_DIR, 'images', 'bg-nft-new.png');
const HOLO_FILE = path.join(PUBLIC_DIR, 'images', 'hologram-nft.png');
const OUT       = path.join(PUBLIC_DIR, 'uploads', 'certificates', 'preview-test.png');

const data = {
  certificateId: 'MAJA-2026-TEST001234',
  productName:   'Gentong Tanah Liat Klasik Estetik (Era 1950)',
  material:      'Tanah Liat',
  dimensions:    '80 x 60 x 80 cm',
  weight:        '30000 gram',
  origin:        'Jawa Timur',
  sellerName:    'setyo hadi',
  sellerStore:   'ELmojo Antique',
  studioName:    'ELmojo Antique',
  issuedAt:      new Date('2026-07-17'),
};

const esc   = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const trunc = (s,n) => s && s.length>n ? s.slice(0,n-1)+'...' : (s||'-');

function wrapAt(text, max) {
  if (!text || text.length<=max) return [text||'-', null];
  const cut = text.lastIndexOf(' ', max);
  const at  = cut>0 ? cut : max;
  return [text.slice(0,at), text.slice(at+1).trim()||null];
}
function formatDate(d) {
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function rowSvg(lbl, val, rowY, showDiv) {
  const baseY = rowY + BY;
  const divY  = rowY + ROW_H - 8;
  return [
    `<text x="${LABEL_X}" y="${baseY}" text-anchor="start" font-family="Arial Narrow,Arial,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" letter-spacing="4" font-weight="700">${esc(lbl)}</text>`,
    `<text x="${COLON_X}" y="${baseY}" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" font-weight="700">:</text>`,
    `<text x="${VALUE_X}" y="${baseY}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(val,26))}</text>`,
    showDiv ? `<line x1="${LABEL_X}" y1="${divY}" x2="${W-62}" y2="${divY}" stroke="${DC}" stroke-width="1.8" opacity="0.30"/>` : '',
  ].join('');
}

const prodId     = data.certificateId.replace('MAJA-','#MC-');
const [wn1, wn2] = wrapAt(data.productName, 30);
const wnY    = TEXT_T;
const wnBy1  = wnY + BY;
const wnBy2  = wnY + BY + VALUE_FONT + 8;
const wnDivY = wnY + ROW_H_WN - 8;

const workNameSvg = [
  `<text x="${LABEL_X}" y="${wnBy1}" text-anchor="start" font-family="Arial Narrow,Arial,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" letter-spacing="4" font-weight="700">WORK NAME</text>`,
  `<text x="${COLON_X}" y="${wnBy1}" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="${LABEL_FONT}" fill="${LC}" font-weight="700">:</text>`,
  `<text x="${VALUE_X}" y="${wnBy1}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(wn1,30))}</text>`,
  wn2 ? `<text x="${VALUE_X}" y="${wnBy2}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="${VALUE_FONT}" fill="${VC}" font-weight="600">${esc(trunc(wn2,30))}</text>` : '',
  `<line x1="${LABEL_X}" y1="${wnDivY}" x2="${W-62}" y2="${wnDivY}" stroke="${DC}" stroke-width="1.8" opacity="0.30"/>`,
].join('');

const rows = [
  ['MATERIAL',     data.material],
  ['DIMENSIONS',   data.dimensions],
  ['WEIGHT',       data.weight],
  ['ORIGIN AREA',  data.origin],
  ['ARTISAN',      data.sellerName],
  ['STUDIO',       data.studioName],
  ['RELEASE DATE', formatDate(data.issuedAt)],
];

const otherStartY = TEXT_T + ROW_H_WN;   // 365 + 158 = 523
const otherSvg = rows.map(([lbl,val],i) =>
  rowSvg(lbl, val, otherStartY + i*ROW_H, i < rows.length-1)
).join('');

const prodIdSvg = `<text x="${PROD_ID_X}" y="${PROD_ID_Y}" text-anchor="middle" font-family="'Courier New',Courier,monospace" font-size="62" fill="${IC}" font-weight="700" letter-spacing="2">${esc(prodId)}</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${prodIdSvg}${workNameSvg}${otherSvg}</svg>`;

console.log('=== Layout Check ===');
console.log(`Frame       : T=${FRAME_T} B=${FRAME_T+FRAME_H} H=${FRAME_H}`);
console.log(`WORK NAME   : ${TEXT_T} -> ${TEXT_T+ROW_H_WN}`);
rows.forEach(([lbl],i)=>{ const y=otherStartY+i*ROW_H; console.log(`${lbl.padEnd(12)}: ${y} -> ${y+ROW_H}  bl=${y+BY}`); });
console.log(`QR          : L=${QR_L}  T=${QR_T}  B=${QR_T+QR_SIZE}  Size=${QR_SIZE}`);
console.log(`Hologram    : L=${HOLO_LEFT}  T=${HOLO_TOP}  B=${HOLO_TOP+HOLO_H}`);
console.log(`Row total   : ${ROW_H_WN}+7x${ROW_H}=${ROW_H_WN+7*ROW_H} (target=${FRAME_H})`);

async function run() {
  let base = await sharp(BG).resize(W,H,{fit:'fill'}).png().toBuffer();

  // placeholder foto
  const ph = await sharp({create:{width:FRAME_W,height:FRAME_H,channels:4,background:{r:30,g:20,b:10,alpha:1}}}).png().toBuffer();
  base = await sharp(base).composite([{input:ph,left:FRAME_L,top:FRAME_T}]).png().toBuffer();

  // Text SVG
  base = await sharp(base).composite([{input:Buffer.from(svg),blend:'over'}]).png().toBuffer();

  // QR transparan, warna dark brown
  const qrBuf = await QRCode.toBuffer('https://majacraft.id/verifikasi/MAJA-2026-TEST001234',
    {type:'png', width:QR_SIZE, margin:1, color:{dark:QR_DARK, light:'#00000000'}});
  base = await sharp(base).composite([{input:qrBuf, left:QR_L, top:QR_T}]).png().toBuffer();

  // Hologram
  if (fs.existsSync(HOLO_FILE)) {
    const h = await sharp(HOLO_FILE).resize(HOLO_W,HOLO_H,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    base = await sharp(base).composite([{input:h,left:HOLO_LEFT,top:HOLO_TOP}]).png().toBuffer();
  }

  fs.mkdirSync(path.dirname(OUT),{recursive:true});
  await sharp(base).toFile(OUT);
  console.log('\nDONE => '+OUT);
}
run().catch(console.error);
