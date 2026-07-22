"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Plus, MapPin, Edit3, Trash2, Check, X, Loader2, Star, Navigation } from "lucide-react";

// Lazy load map (tidak support SSR)
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false, loading: () => (
  <div className="h-48 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">Memuat peta...</div>
)});

type Address = { id: string; label: string; name: string; phone: string; address: string; city: string; province: string; zip: string; isDefault: boolean };
type Region = { id: string; name: string };

const EMPTY_FORM = { label: "Rumah", name: "", phone: "", address: "", province: "", provinceId: "", city: "", cityId: "", district: "", districtId: "", village: "", zip: "", isDefault: false, lat: -6.2088, lng: 106.8456 };

const API_BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export default function AlamatPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Region data
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [loadingRegion, setLoadingRegion] = useState({ city: false, district: false, village: false });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/addresses");
    if (res.ok) setAddresses((await res.json()).data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch(`${API_BASE}/provinces.json`).then(r => r.json()).then(setProvinces).catch(() => {});
  }, []);

  const onProvinceChange = async (id: string, name: string) => {
    setForm(f => ({ ...f, provinceId: id, province: name, cityId: "", city: "", district: "", village: "" }));
    setCities([]); setDistricts([]); setVillages([]);
    if (!id) return;
    setLoadingRegion(l => ({ ...l, city: true }));
    const data = await fetch(`${API_BASE}/regencies/${id}.json`).then(r => r.json()).catch(() => []);
    setCities(data); setLoadingRegion(l => ({ ...l, city: false }));
  };

  const onCityChange = async (id: string, name: string) => {
    setForm(f => ({ ...f, cityId: id, city: name, district: "", village: "" }));
    setDistricts([]); setVillages([]);
    if (!id) return;
    setLoadingRegion(l => ({ ...l, district: true }));
    const data = await fetch(`${API_BASE}/districts/${id}.json`).then(r => r.json()).catch(() => []);
    setDistricts(data); setLoadingRegion(l => ({ ...l, district: false }));
  };

  const onDistrictChange = async (id: string, name: string) => {
    setForm(f => ({ ...f, districtId: id, district: name, village: "" }));
    setVillages([]);
    if (!id) return;
    setLoadingRegion(l => ({ ...l, village: true }));
    const data = await fetch(`${API_BASE}/villages/${id}.json`).then(r => r.json()).catch(() => []);
    setVillages(data); setLoadingRegion(l => ({ ...l, village: false }));
  };

  // Geocode alamat ke koordinat + auto-fill kode pos
  const geocodeAddress = async (overrideQuery?: string) => {
    const query = overrideQuery ?? [form.address, form.village, form.district, form.city, form.province, "Indonesia"].filter(Boolean).join(", ");
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ID&addressdetails=1`,
        { headers: { "Accept-Language": "id", "User-Agent": "MajaCraft/1.0" } }
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const postcode = data[0].address?.postcode ?? "";
        setForm(f => ({ ...f, lat, lng, ...(postcode && !f.zip ? { zip: postcode } : {}) }));
      }
    } catch { /* network error, skip */ }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null); setError("");
    setCities([]); setDistricts([]); setVillages([]);
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setForm({ ...EMPTY_FORM, label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, province: a.province, zip: a.zip, isDefault: a.isDefault });
    setEditId(a.id); setError(""); setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.province || !form.city) return setError("Nama, alamat, provinsi, dan kota wajib diisi.");
    setSaving(true); setError("");
    const payload = { label: form.label, name: form.name, phone: form.phone, address: [form.address, form.village, form.district].filter(Boolean).join(", "), city: form.city, province: form.province, zip: form.zip, isDefault: form.isDefault };
    const url = editId ? `/api/addresses/${editId}` : "/api/addresses";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { await load(); setShowForm(false); }
    else { const d = await res.json(); setError(d.error ?? "Gagal menyimpan."); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus alamat ini?")) return;
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    await load();
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
    await load();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/akun" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold text-foreground">Alamat Pengiriman</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs btn-gold h-8 px-3 rounded-lg font-semibold">
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-xl border border-amber-700/30 bg-card mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-500">{editId ? "Edit Alamat" : "Alamat Baru"}</p>
            <button type="button" onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs text-amber-600">Label</label>
            <div className="flex gap-2 mt-1">
              {["Rumah", "Kantor", "Lainnya"].map(l => (
                <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-colors ${form.label === l ? "border-amber-500 bg-amber-900/20 text-amber-400" : "border-border text-muted-foreground hover:border-amber-700"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Nama & Telepon */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-amber-600">Nama Penerima *</label>
              <input type="text" placeholder="Nama lengkap" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-amber-600">No. Telepon</label>
              <input type="tel" placeholder="08xx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* Provinsi */}
          <div>
            <label className="text-xs text-amber-600">Provinsi *</label>
            <select value={form.provinceId} onChange={e => onProvinceChange(e.target.value, e.target.options[e.target.selectedIndex].text)}
              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 appearance-none">
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Kota/Kabupaten */}
          <div>
            <label className="text-xs text-amber-600">Kota / Kabupaten *</label>
            <select value={form.cityId} onChange={e => onCityChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!form.provinceId || loadingRegion.city}
              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-50">
              <option value="">{loadingRegion.city ? "Memuat..." : "Pilih Kota/Kabupaten"}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Kecamatan & Kelurahan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-amber-600">Kecamatan</label>
              <select value={form.districtId} onChange={e => onDistrictChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!form.cityId || loadingRegion.district}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-50">
                <option value="">{loadingRegion.district ? "Memuat..." : "Pilih Kecamatan"}</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-amber-600">Kelurahan / Desa</label>
              <select value={form.village}
                onChange={e => {
                  const village = e.target.value;
                  setForm(f => ({ ...f, village }));
                  // Auto-geocode saat kelurahan dipilih → update peta + kode pos
                  if (village && form.district && form.city && form.province) {
                    setTimeout(() => geocodeAddress([village, form.district, form.city, form.province, "Indonesia"].join(", ")), 300);
                  }
                }}
                disabled={!form.district || loadingRegion.village}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-50">
                <option value="">{loadingRegion.village ? "Memuat..." : "Pilih Kelurahan"}</option>
                {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {/* Alamat detail & kode pos */}
          <div>
            <label className="text-xs text-amber-600">Nama Jalan / Detail Alamat *</label>
            <input type="text" placeholder="cth: Jl. Mawar No. 12 RT 03/RW 05" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-amber-600">Kode Pos</label>
              <input type="text" placeholder="12180" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500" />
            </div>
            <div className="flex flex-col justify-end">
              <button type="button"
                onClick={() => geocodeAddress([form.address, form.village, form.district, form.city, form.province, "Indonesia"].filter(Boolean).join(", "))}
                className="h-9 px-3 rounded-lg border border-amber-700/30 text-amber-600 hover:bg-amber-900/10 text-xs font-medium flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Temukan di Peta
              </button>
            </div>
          </div>

          {/* Peta */}
          <div>
            <label className="text-xs text-amber-600 mb-1 block">Pin Lokasi di Peta</label>
            <MapPicker lat={form.lat} lng={form.lng} onMove={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
            <p className="text-xs text-muted-foreground mt-1">Klik atau drag pin untuk sesuaikan lokasi</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="accent-amber-600" />
            <span className="text-xs text-muted-foreground">Jadikan alamat utama</span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-9 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted">Batal</button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 rounded-lg btn-gold text-sm font-semibold flex items-center justify-center gap-1">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? "Menyimpan..." : "Simpan Alamat"}
            </button>
          </div>
        </form>
      )}

      {/* Daftar Alamat */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />Belum ada alamat tersimpan
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`p-4 rounded-xl border bg-card ${addr.isDefault ? "border-amber-600/40" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{addr.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-600 border border-amber-800/30">{addr.label}</span>
                    {addr.isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-500 border border-green-800/30 flex items-center gap-1"><Check className="w-2.5 h-2.5" />Utama</span>}
                  </div>
                  {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                  <p className="text-xs text-muted-foreground leading-relaxed">{addr.address}, {addr.city}, {addr.province} {addr.zip}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)} title="Jadikan utama" className="p-1.5 hover:bg-muted rounded text-amber-700 hover:text-amber-500">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)} className="p-1.5 hover:bg-muted rounded text-amber-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(addr.id)} className="p-1.5 hover:bg-muted rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
