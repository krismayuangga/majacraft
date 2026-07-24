import crypto from "crypto";

const VA = process.env.IPAYMU_VA ?? "";
const API_KEY = process.env.IPAYMU_API_KEY ?? "";
const BASE_URL = (process.env.IPAYMU_BASE_URL ?? "https://my.ipaymu.com").replace(/\/$/, "");

// Validasi env vars saat runtime
function assertEnv() {
  if (!VA || !API_KEY) {
    throw new Error("IPAYMU_VA dan IPAYMU_API_KEY harus diset di .env");
  }
}

// Map metode pembayaran internal → iPaymu paymentMethod + paymentChannel
export const PAYMENT_MAP: Record<string, { method: string; channel: string }> = {
  "bca-va":     { method: "va",      channel: "bca" },
  "bni-va":     { method: "va",      channel: "bni" },
  "mandiri-va": { method: "va",      channel: "mandiri" },
  "bri-va":     { method: "va",      channel: "bri" },
  "qris":       { method: "qris",    channel: "qris" },
  "gopay":      { method: "ewallet", channel: "gopay" },
  "ovo":        { method: "ewallet", channel: "ovo" },
  "dana":       { method: "ewallet", channel: "dana" },
  "shopeepay":  { method: "ewallet", channel: "shopeepay" },
};

function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function generateSignature(body: object): string {
  // SHA256 dari JSON body (lowercase hex)
  const bodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
  // String yang akan di-sign: POST:{VA}:{bodyHash}:{API_KEY}
  const stringToSign = `POST:${VA}:${bodyHash}:${API_KEY}`;
  // HMAC-SHA256 dengan API_KEY sebagai key
  return crypto
    .createHmac("sha256", API_KEY)
    .update(stringToSign)
    .digest("hex");
}

function buildHeaders(body: object) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    va: VA,
    signature: generateSignature(body),
    timestamp: generateTimestamp(),
  };
}

export interface IpaymuRedirectResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface IpaymuRefundResult {
  success: boolean;
  refundId?: string;
  rawStatus?: number | string;
  error?: string;
}

/**
 * Redirect Payment — user diarahkan ke halaman iPaymu untuk memilih/membayar
 *
 * TODO — Split Bill Integration (iPaymu feature):
 * iPaymu mendukung pembagian pembayaran otomatis (split payment) ke multiple rekening.
 * Dengan fitur ini, fee platform dapat langsung dipotong di level payment gateway:
 * - Seller harus registrasi akun iPaymu terlebih dahulu
 * - Platform mendaftarkan VA seller ke sistem iPaymu
 * - Saat transaksi: buyer bayar ke VA utama → iPaymu otomatis split:
 *   - (100% - feePercent) diteruskan ke VA seller
 *   - feePercent ditahan di VA platform
 * - Implementasi menggunakan: params.splitPayment = [{ va: sellerVA, amount: netAmount }]
 * - Ref: iPaymu Split Payment API docs
 */
export async function createRedirectPayment(params: {
  orderId: string;
  amount: number;
  products: { name: string; qty: number; price: number }[];
  buyer: { name: string; email: string; phone: string };
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}): Promise<IpaymuRedirectResult> {
  assertEnv();

  const body = {
    product:     params.products.map((p) => p.name),
    qty:         params.products.map((p) => String(p.qty)),
    price:       params.products.map((p) => String(p.price)),
    amount:      String(params.amount),
    returnUrl:   params.returnUrl,
    cancelUrl:   params.cancelUrl,
    notifyUrl:   params.notifyUrl,
    referenceId: params.orderId,
    buyerName:   params.buyer.name,
    buyerEmail:  params.buyer.email,
    buyerPhone:  params.buyer.phone,
  };

  const endpoint = `${BASE_URL}/api/v2/payment`;
  console.log("[iPaymu] Redirect payment →", endpoint, { va: VA, referenceId: params.orderId });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(body),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    console.log("[iPaymu] Response:", JSON.stringify(json));

    if (json.Status === 200 && json.Data?.Url) {
      return { success: true, sessionId: json.Data.SessionID, url: json.Data.Url };
    }
    const errMsg = json.Message ?? json.Data?.Message ?? `Status ${json.Status}`;
    console.error("[iPaymu] Error:", errMsg, json);
    return { success: false, error: errMsg };
  } catch (e) {
    console.error("[iPaymu] Fetch error:", e);
    return { success: false, error: String(e) };
  }
}

/**
 * Direct Payment — langsung ke metode spesifik (VA/QRIS/Ewallet)
 */
export async function createDirectPayment(params: {
  orderId: string;
  amount: number;
  paymentMethodKey: string;
  buyer: { name: string; email: string; phone: string };
  notifyUrl: string;
}): Promise<IpaymuRedirectResult> {
  const mapping = PAYMENT_MAP[params.paymentMethodKey];
  if (!mapping) return { success: false, error: "Metode pembayaran tidak didukung" };

  const body = {
    name: params.buyer.name,
    phone: params.buyer.phone,
    email: params.buyer.email,
    amount: params.amount,
    comments: `Pembayaran MajaCraft #${params.orderId.slice(-8)}`,
    notifyUrl: params.notifyUrl,
    referenceId: params.orderId,
    paymentMethod: mapping.method,
    paymentChannel: mapping.channel,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/v2/payment/direct`, {
      method: "POST",
      headers: buildHeaders(body),
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.Status === 200 && json.Data) {
      return { success: true, sessionId: json.Data.TransactionId, url: json.Data.Via ?? json.Data.Url };
    }
    return { success: false, error: json.Message ?? "Gagal membuat pembayaran" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Cek status transaksi via iPaymu
 */
export async function checkTransaction(transactionId: string) {
  const body = { transactionId };
  try {
    const res = await fetch(`${BASE_URL}/api/v2/transaction`, {
      method: "POST",
      headers: buildHeaders(body),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Refund transaksi via iPaymu.
 * Catatan: endpoint default dapat disesuaikan lewat env IPAYMU_REFUND_PATH
 * bila dokumentasi merchant menggunakan path berbeda.
 */
export async function createRefund(params: {
  transactionId: string;
  amount: number;
  reason?: string;
  referenceId?: string;
}): Promise<IpaymuRefundResult> {
  assertEnv();

  const autoRefundEnabled = process.env.IPAYMU_AUTO_REFUND === "true";
  const configuredPath = process.env.IPAYMU_REFUND_PATH;
  if (!autoRefundEnabled || !configuredPath) {
    return {
      success: false,
      error: "Auto refund belum diaktifkan. Set IPAYMU_AUTO_REFUND=true dan IPAYMU_REFUND_PATH.",
    };
  }

  const body = {
    transactionId: params.transactionId,
    amount: Number(params.amount),
    reason: params.reason ?? "Dispute resolution refund",
    ...(params.referenceId ? { referenceId: params.referenceId } : {}),
  };

  const refundPath = configuredPath;
  const endpoint = `${BASE_URL}${refundPath.startsWith("/") ? refundPath : `/${refundPath}`}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(body),
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    const statusCode = json?.Status ?? json?.status ?? res.status;
    const success =
      statusCode === 200 ||
      statusCode === "200" ||
      json?.success === true ||
      json?.StatusDesc === "Success";

    if (success) {
      return {
        success: true,
        refundId: json?.Data?.RefundId ?? json?.Data?.TransactionId ?? json?.Data?.id,
        rawStatus: statusCode,
      };
    }

    const msg = json?.Message ?? json?.Data?.Message ?? `Refund gagal (status ${statusCode})`;
    return { success: false, rawStatus: statusCode, error: msg };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
