// preview-cert-v2.js – Certificate v2
const sharp  = require('sharp');
const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');

const W = 1536, H = 1024;
const FRAME_R = 632;   // frame right edge
const FRAME_B = 757;

// Text layout: geser kanan dari frame (gap 45px dari frame right)
const GAP_FROM_FRAME = 48;
const ICON_X  = FRAME_R + GAP_FROM_FRAME;          // 680
const LABEL_X = ICON_X + 32;                        // 712
const COLON_X = 924;    // updated: setelah RELEASE DATE terpanjang
const VALUE_X = 946;    // updated

const TEXT_T     = 245;
const ROW_H_WN   = 70;   // work name 2 baris: 70 + 7×63 = 511 ≈ FRAME_H ✓
const ROW_H      = 63;
const BY         = 43;   // baseline single row (center of 63px)

const LABEL_FONT = 22;
const VALUE_FONT = 22;   // semua font sama

// Satu warna brownish untuk semua: ikon, label, dan nilai
const UNIFIED = '#4A2200';
const LC = UNIFIED;
const VC = UNIFIED;
const DC = '#8A6020';   // divider
const IC = UNIFIED;     // cert ID: sama dengan teks area

const COLON_X_NEW = 924;    // setelah RELEASE DATE terpanjang (712 + ~212px)
const VALUE_X_NEW = 946;

const QRC = '#0D0500';   // near-black for best QR scannability

const QR_SIZE = 174;     // sama tinggi dengan HOLO_H
const QR_T    = FRAME_B + 28;
const QR_L    = W - 110 - QR_SIZE;      // geser kiri agar tidak kena border card
const HOLO_H  = 174;
const HOLO_W  = Math.round(HOLO_H * (1578 / 997));
const HOLO_T  = QR_T;
const HOLO_L  = QR_L - 18 - HOLO_W;    // ikut geser kiri

const PROD_ID_X  = 117 + Math.round(515 / 2);  // 374 (center frame)
const CERT_LBL_Y = FRAME_B + 38;               // "CERTIFICATE ID" label
const PROD_ID_Y  = FRAME_B + 82;               // nomor ID di bawah label

const PUB  = path.join(process.cwd(), 'public');
const BG   = path.join(PUB, 'images', 'background-nft.png');
const HOLO = path.join(PUB, 'images', 'hologram-sertifikat.png');
const OUT  = path.join(PUB, 'uploads', 'certificates', 'preview-v2.png');

const data = {
  certificateId: 'MAJA-2026-TEST001234',
  productName:   'Gentong Tanah Liat Klasik Estetik (Era 1950)',
  material:      'Tanah Liat',
  dimensions:    '80 x 60 x 80 cm',
  weight:        '30000 gram',
  origin:        'Jawa Timur',
  sellerName:    'setyo hadi',
  studioName:    'ELmojo Antique',
  issuedAt:      new Date('2026-07-17'),
};

const esc   = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const trunc = (s,n) => s && s.length > n ? s.slice(0, n-1) + '...' : (s || '-');
const fmt   = d => d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});

// Icons bigger: ±13-14px range, stroke 2px, vibrant gold
function iconSvg(type, cx, cy) {
  const s = LC, sw = '2', op = '0.85';
  switch (type) {
    case 'vase':
      return '<ellipse cx="'+cx+'" cy="'+(cy-9)+'" rx="8" ry="5" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<path d="M'+(cx-8)+' '+(cy-5)+' Q'+(cx-13)+' '+(cy+2)+' '+(cx-7)+' '+(cy+10)+' L'+(cx+7)+' '+(cy+10)+' Q'+(cx+13)+' '+(cy+2)+' '+(cx+8)+' '+(cy-5)+'" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<line x1="'+(cx-7)+'" y1="'+(cy+10)+'" x2="'+(cx+7)+'" y2="'+(cy+10)+'" stroke="'+s+'" stroke-width="2.2" opacity="'+op+'"/>'
           + '<ellipse cx="'+cx+'" cy="'+(cy-2)+'" rx="10" ry="3.5" fill="none" stroke="'+s+'" stroke-width="1" opacity="0.4"/>';
    case 'gem':
      return '<polygon points="'+cx+','+(cy-13)+' '+(cx+11)+','+(cy-3)+' '+(cx+7)+','+(cy+10)+' '+(cx-7)+','+(cy+10)+' '+(cx-11)+','+(cy-3)+'" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<line x1="'+(cx-11)+'" y1="'+(cy-3)+'" x2="'+(cx+11)+'" y2="'+(cy-3)+'" stroke="'+s+'" stroke-width="1.2" opacity="0.45"/>'
           + '<line x1="'+cx+'" y1="'+(cy-13)+'" x2="'+cx+'" y2="'+(cy+10)+'" stroke="'+s+'" stroke-width="0.9" opacity="0.35"/>';
    case 'ruler':
      return '<rect x="'+(cx-12)+'" y="'+(cy-5)+'" width="24" height="10" rx="2.5" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<line x1="'+(cx-6)+'" y1="'+(cy-8)+'" x2="'+(cx-6)+'" y2="'+(cy+8)+'" stroke="'+s+'" stroke-width="1.4" opacity="0.5"/>'
           + '<line x1="'+cx+'" y1="'+(cy-8)+'" x2="'+cx+'" y2="'+(cy+8)+'" stroke="'+s+'" stroke-width="1.4" opacity="0.5"/>'
           + '<line x1="'+(cx+6)+'" y1="'+(cy-8)+'" x2="'+(cx+6)+'" y2="'+(cy+8)+'" stroke="'+s+'" stroke-width="1.4" opacity="0.5"/>';
    case 'scale':
      return '<line x1="'+(cx-12)+'" y1="'+(cy-2)+'" x2="'+(cx+12)+'" y2="'+(cy-2)+'" stroke="'+s+'" stroke-width="2.2" opacity="'+op+'"/>'
           + '<line x1="'+cx+'" y1="'+(cy-10)+'" x2="'+cx+'" y2="'+(cy+9)+'" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<path d="M'+(cx-12)+' '+(cy-2)+' L'+(cx-15)+' '+(cy+5)+' L'+(cx-9)+' '+(cy+5)+' Z" fill="none" stroke="'+s+'" stroke-width="1.6" opacity="0.6"/>'
           + '<path d="M'+(cx+12)+' '+(cy-2)+' L'+(cx+15)+' '+(cy+5)+' L'+(cx+9)+' '+(cy+5)+' Z" fill="none" stroke="'+s+'" stroke-width="1.6" opacity="0.6"/>'
           + '<line x1="'+(cx-5)+'" y1="'+(cy-10)+'" x2="'+(cx+5)+'" y2="'+(cy-10)+'" stroke="'+s+'" stroke-width="1.6" opacity="0.6"/>';
    case 'pin':
      return '<circle cx="'+cx+'" cy="'+(cy-6)+'" r="7" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<circle cx="'+cx+'" cy="'+(cy-6)+'" r="2.5" fill="'+s+'" opacity="0.7"/>'
           + '<path d="M'+(cx-6)+' '+(cy-2)+' Q'+(cx-5)+' '+(cy+5)+' '+cx+' '+(cy+13)+' Q'+(cx+5)+' '+(cy+5)+' '+(cx+6)+' '+(cy-2)+'" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>';
    case 'person':
      return '<circle cx="'+cx+'" cy="'+(cy-8)+'" r="6" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<path d="M'+(cx-11)+' '+(cy+12)+' Q'+(cx-10)+' '+(cy-1)+' '+cx+' '+(cy-1)+' Q'+(cx+10)+' '+(cy-1)+' '+(cx+11)+' '+(cy+12)+'" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>';
    case 'building':
      return '<rect x="'+(cx-12)+'" y="'+(cy-1)+'" width="24" height="12" rx="1" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<rect x="'+(cx-9)+'" y="'+(cy+2)+'" width="5" height="9" fill="'+s+'" opacity="0.28"/>'
           + '<rect x="'+(cx+4)+'" y="'+(cy+2)+'" width="5" height="9" fill="'+s+'" opacity="0.28"/>'
           + '<rect x="'+(cx-14)+'" y="'+(cy-5)+'" width="28" height="4" rx="1" fill="'+s+'" opacity="0.55"/>'
           + '<polygon points="'+(cx-10)+','+(cy-5)+' '+cx+','+(cy-15)+' '+(cx+10)+','+(cy-5)+'" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>';
    case 'calendar':
      return '<rect x="'+(cx-12)+'" y="'+(cy-6)+'" width="24" height="18" rx="2.5" fill="none" stroke="'+s+'" stroke-width="'+sw+'" opacity="'+op+'"/>'
           + '<line x1="'+(cx-12)+'" y1="'+(cy-1)+'" x2="'+(cx+12)+'" y2="'+(cy-1)+'" stroke="'+s+'" stroke-width="1.6" opacity="0.55"/>'
           + '<rect x="'+(cx-8)+'" y="'+(cy+4)+'" width="5" height="5" rx="1" fill="'+s+'" opacity="0.4"/>'
           + '<rect x="'+(cx+3)+'" y="'+(cy+4)+'" width="5" height="5" rx="1" fill="'+s+'" opacity="0.4"/>'
           + '<line x1="'+(cx-6)+'" y1="'+(cy-9)+'" x2="'+(cx-6)+'" y2="'+(cy-4)+'" stroke="'+s+'" stroke-width="2.2" opacity="0.68"/>'
           + '<line x1="'+(cx+6)+'" y1="'+(cy-9)+'" x2="'+(cx+6)+'" y2="'+(cy-4)+'" stroke="'+s+'" stroke-width="2.2" opacity="0.68"/>';
    default:
      return '<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+s+'" opacity="0.75"/>';
  }
}

function rowSvg(iconType, lbl, val, rowY, rowH, showDiv, isWN) {
  const divY   = rowY + rowH - 4;
  // Icon: untuk WN centered antara 2 baris teks, untuk lainnya center of row
  const iconCY = isWN ? rowY + 40 : rowY + Math.round(rowH / 2);

  let textPart;
  if (isWN) {
    // Work name: 2 baris, same font size, wrap di ~26 chars
    const cut = val.length > 26 ? val.lastIndexOf(' ', 26) : val.length;
    const at  = cut > 0 ? cut : 26;
    const l1  = val.slice(0, at);
    const l2  = val.length > at ? val.slice(at+1).trim() : null;
    const by1 = rowY + 38;
    const by2 = rowY + 38 + VALUE_FONT + 4;
    textPart =
        '<text x="'+LABEL_X+'" y="'+by1+'" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="'+LABEL_FONT+'" fill="'+LC+'" letter-spacing="3" font-weight="800">'+esc(lbl)+'</text>'
      + '<text x="'+COLON_X+'" y="'+by1+'" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="'+LABEL_FONT+'" fill="'+LC+'" font-weight="800">:</text>'
      + '<text x="'+VALUE_X+'" y="'+by1+'" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="'+VALUE_FONT+'" fill="'+VC+'" font-weight="600">'+esc(trunc(l1,30))+'</text>'
      + (l2 ? '<text x="'+VALUE_X+'" y="'+by2+'" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="'+VALUE_FONT+'" fill="'+VC+'" font-weight="600">'+esc(trunc(l2,30))+'</text>' : '');
  } else {
    const baseY = rowY + BY;
    textPart =
        '<text x="'+LABEL_X+'" y="'+baseY+'" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="'+LABEL_FONT+'" fill="'+LC+'" letter-spacing="3" font-weight="800">'+esc(lbl)+'</text>'
      + '<text x="'+COLON_X+'" y="'+baseY+'" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="'+LABEL_FONT+'" fill="'+LC+'" font-weight="800">:</text>'
      + '<text x="'+VALUE_X+'" y="'+baseY+'" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="'+VALUE_FONT+'" fill="'+VC+'" font-weight="600">'+esc(trunc(val,32))+'</text>';
  }

  return '<g>'
    + iconSvg(iconType, ICON_X, iconCY)
    + textPart
    + (showDiv ? '<line x1="'+LABEL_X+'" y1="'+divY+'" x2="'+(W-44)+'" y2="'+divY+'" stroke="'+DC+'" stroke-width="0.9" opacity="0.24"/>' : '')
    + '</g>';
}

const rows = [
  ['vase',    'WORK NAME',   data.productName, true],
  ['gem',     'MATERIAL',    data.material,    false],
  ['ruler',   'DIMENSIONS',  data.dimensions,  false],
  ['scale',   'WEIGHT',      data.weight,      false],
  ['pin',     'ORIGIN AREA', data.origin,      false],
  ['person',  'ARTISAN',     data.sellerName,  false],
  ['building','STUDIO',      data.studioName,  false],
  ['calendar','RELEASE DATE',fmt(data.issuedAt),false],
];

// Work name row height berbeda (2 baris), hitung rowY per baris
const rowsSvg = rows.map(([ico,lbl,val,wn],i) => {
  const rowY = i === 0 ? TEXT_T : TEXT_T + ROW_H_WN + (i-1)*ROW_H;
  const rowH = i === 0 ? ROW_H_WN : ROW_H;
  return rowSvg(ico, lbl, val, rowY, rowH, i < rows.length-1, wn);
}).join('');

const certId = data.certificateId.replace('MAJA-','#MC-');
const certIdSvg =
  // Label "CERTIFICATE ID"
  '<text x="'+PROD_ID_X+'" y="'+CERT_LBL_Y+'" text-anchor="middle"'
  + ' font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#1A0A00"'
  + ' font-weight="800" letter-spacing="6" opacity="0.95">CERTIFICATE ID</text>'
  // Nomor ID
  + '<text x="'+PROD_ID_X+'" y="'+PROD_ID_Y+'" text-anchor="middle"'
  + ' font-family="Courier New,Courier,monospace" font-size="38" fill="#1A0A00"'
  + ' font-weight="700" letter-spacing="1.5" opacity="1.0">'+esc(certId)+'</text>';

const fullSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'">'+rowsSvg+certIdSvg+'</svg>';

console.log('ICON_X='+ICON_X+' LABEL_X='+LABEL_X+' COLON_X='+COLON_X+' VALUE_X='+VALUE_X);
console.log('TEXT_T='+TEXT_T+' ROW_H='+ROW_H+' END='+(TEXT_T+8*ROW_H)+' FRAME_B='+FRAME_B);

async function run() {
  let base = await sharp(BG).resize(W, H, {fit:'fill'}).png().toBuffer();
  base = await sharp(base).composite([{input: Buffer.from(fullSvg), blend:'over'}]).png().toBuffer();

  const qrBuf = await QRCode.toBuffer('https://majacraft.id/verifikasi/MAJA-2026-TEST001234',
    {type:'png', width:QR_SIZE, margin:1, color:{dark:QRC, light:'#00000000'}});
  base = await sharp(base).composite([{input:qrBuf, left:QR_L, top:QR_T}]).png().toBuffer();

  if (fs.existsSync(HOLO)) {
    const h = await sharp(HOLO)
      .resize(HOLO_W, HOLO_H, {fit:'contain', background:{r:0,g:0,b:0,alpha:0}})
      .png().toBuffer();
    base = await sharp(base).composite([{input:h, left:HOLO_L, top:HOLO_T}]).png().toBuffer();

    // Short ID di bawah logo M pada hologram
    const shortId  = data.certificateId.split('-').slice(2).join('');
    const holoCX   = HOLO_L + Math.round(HOLO_W / 2);
    const holoTxtY = HOLO_T + HOLO_H - 16;
    const holoTxtSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'">'
      + '<text x="'+holoCX+'" y="'+holoTxtY+'" text-anchor="middle"'
      + ' font-family="Courier New,Courier,monospace" font-size="17" fill="#C8A030"'
      + ' font-weight="700" letter-spacing="2.5" opacity="0.90">'+esc(shortId)+'</text>'
      + '</svg>';
    base = await sharp(base).composite([{input:Buffer.from(holoTxtSvg), blend:'over'}]).png().toBuffer();
  }

  fs.mkdirSync(path.dirname(OUT), {recursive:true});
  await sharp(base).toFile(OUT);
  console.log('DONE => '+OUT);
}
run().catch(console.error);
