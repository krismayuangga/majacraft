/**
 * RajaOngkir Shipping Cost API Service
 * Base URL: https://rajaongkir.komerce.id/api/v1/
 * Auth: header key: API_KEY
 */

const BASE_URL = "https://rajaongkir.komerce.id/api/v1";
const API_KEY  = process.env.RAJAONGKIR_API_KEY ?? "";

function headers() {
  return { key: API_KEY, "Content-Type": "application/json" };
}

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface RoDestination {
  id: string;
  label: string;        // "Kota/Kab + Province"
  district_name: string;
  city_name: string;
  province_name: string;
}

export interface RoCourierResult {
  courier_name:    string;   // "JNE", "J&T", "SiCepat", dll
  courier_code:    string;   // "jne", "jnt", "sicepat"
  service_name:    string;   // "REG", "YES", "BEST"
  service_code:    string;
  etd:             string;   // "2-3 HARI"
  price:           number;   // harga dalam rupiah
}

export interface RoTrackingEvent {
  datetime: string;
  description: string;
  city?: string;
}

export interface RoTrackingResult {
  courier: string;
  waybill: string;
  status: string;
  delivered: boolean;
  lastUpdate?: string;
  events: RoTrackingEvent[];
}

function normalizeCourierCode(raw: string) {
  const value = raw.trim().toLowerCase();
  if (!value) return "";

  if (value.includes("j&t") || value.includes("jnt") || value.includes("jet")) return "jnt";
  if (value.includes("jne")) return "jne";
  if (value.includes("sicepat")) return "sicepat";
  if (value.includes("anteraja")) return "anteraja";
  if (value.includes("ninja")) return "ninja";
  if (value.includes("pos")) return "pos";

  return value.replace(/[^a-z0-9]/g, "");
}

// ─── 1. SEARCH DESTINATION ────────────────────────────────────────────────

/**
 * Cari destination ID berdasarkan nama kota/kecamatan
 * Endpoint: GET /destination/domestic-destination?search=...
 */
export async function searchDestination(query: string): Promise<RoDestination[]> {
  if (!API_KEY) throw new Error("RAJAONGKIR_API_KEY belum diset di .env.local");

  const url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(query)}&limit=10`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RajaOngkir search error ${res.status}: ${text}`);
  }

  const json = await res.json();
  // Response: { data: [ { id, label, district_name, city_name, province_name } ] }
  return (json.data ?? json.rajaongkir?.results ?? []) as RoDestination[];
}

/**
 * Cari destination ID — ambil yang paling cocok (pertama)
 * Fallback ke kota jika kecamatan tidak ditemukan
 */
export async function findDestinationId(cityOrDistrict: string): Promise<string | null> {
  const results = await searchDestination(cityOrDistrict);
  return results[0]?.id ?? null;
}

// ─── 2. CALCULATE DOMESTIC COST ───────────────────────────────────────────

/**
 * Hitung ongkir domestik
 * Endpoint: POST /calculate/domestic-cost
 *
 * @param originId      - destination ID kota asal (toko seller)
 * @param destinationId - destination ID kota tujuan (alamat buyer)
 * @param weight        - berat total dalam gram
 * @param couriers      - array courier code, e.g. ["jne","jnt","sicepat","anteraja"]
 */
export async function calculateDomesticCost(params: {
  originId:      string | number;
  destinationId: string | number;
  weight:        number;
  couriers?:     string[];
}): Promise<RoCourierResult[]> {
  if (!API_KEY) throw new Error("RAJAONGKIR_API_KEY belum diset di .env.local");

  const couriers = params.couriers ?? ["jne", "jnt", "sicepat", "anteraja", "ninja"];

  // RajaOngkir v2 minta form-data (bukan JSON)
  const formData = new URLSearchParams();
  formData.append("origin",      String(params.originId));
  formData.append("destination", String(params.destinationId));
  formData.append("weight",      String(params.weight));
  formData.append("courier",     couriers.join(":"));

  console.log("[RajaOngkir] calculate form:", formData.toString());

  const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
    method:  "POST",
    headers: { key: API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body:    formData.toString(),
  });

  const json = await res.json();
  console.log("[RajaOngkir] response meta:", json.meta?.code, json.meta?.message?.slice(0, 80));

  if (!res.ok || json.meta?.code !== 200) {
    throw new Error(`RajaOngkir calculate error ${res.status}: ${JSON.stringify(json)}`);
  }

  // Response format flat: [{ name, code, service, description, cost, etd }]
  const rawData: Array<{
    name: string; code: string; service: string;
    description?: string; cost: number; etd: string;
  }> = json.data ?? [];

  return rawData
    .filter(item => item.cost > 0)
    .map(item => ({
      courier_name: item.name,
      courier_code: item.code,
      service_name: item.description ?? item.service,
      service_code: item.service,
      etd:   item.etd.replace(/day/gi, "Hari").trim(),
      price: item.cost,
    }))
    .sort((a, b) => a.price - b.price);
}

// ─── 3. TRACK WAYBILL (LIVE RESI) ────────────────────────────────────────

/**
 * Lacak resi secara live ke RajaOngkir/Komerce.
 * Endpoint umum: POST /track/waybill
 */
export async function trackWaybill(params: {
  waybill: string;
  courier: string;
}): Promise<RoTrackingResult> {
  if (!API_KEY) throw new Error("RAJAONGKIR_API_KEY belum diset di .env.local");

  const waybill = String(params.waybill ?? "").trim().toUpperCase();
  const courier = normalizeCourierCode(String(params.courier ?? ""));
  if (!waybill) throw new Error("Waybill wajib diisi");
  if (!courier) throw new Error("Kurir tidak valid untuk tracking");

  const formData = new URLSearchParams();
  // RajaOngkir v1 track endpoint expects "awb" for waybill number.
  formData.append("awb", waybill);
  formData.append("courier", courier);

  const res = await fetch(`${BASE_URL}/track/waybill`, {
    method: "POST",
    headers: { key: API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || (typeof json?.meta?.code === "number" && json.meta.code !== 200)) {
    throw new Error(`RajaOngkir tracking error ${res.status}: ${JSON.stringify(json)}`);
  }

  const data = json?.data ?? json?.result ?? json?.rajaongkir?.result ?? {};
  const summary = data?.summary ?? {};
  const details = data?.details ?? {};
  const manifestRaw = Array.isArray(data?.manifest)
    ? data.manifest
    : Array.isArray(data?.history)
      ? data.history
      : [];

  const events: RoTrackingEvent[] = manifestRaw
    .map((item: Record<string, unknown>) => {
      const manifestDate = String(item.manifest_date ?? item.date ?? "").trim();
      const manifestTime = String(item.manifest_time ?? item.time ?? "").trim();
      const datetime = [manifestDate, manifestTime].filter(Boolean).join(" ").trim();
      const description = String(item.manifest_description ?? item.desc ?? item.description ?? "").trim();
      const city = String(item.city_name ?? item.city ?? "").trim();
      return { datetime, description, city: city || undefined };
    })
    .filter((event: RoTrackingEvent) => event.description);

  const status = String(summary.status ?? details.status ?? "Dalam pengiriman").trim();
  const delivered = /delivered|diterima|sampai/i.test(status);
  const lastUpdate = events[0]?.datetime || String(summary.date ?? "").trim() || undefined;

  return {
    courier: String(summary.courier_name ?? details.courier ?? params.courier).trim() || params.courier,
    waybill,
    status,
    delivered,
    lastUpdate,
    events,
  };
}
