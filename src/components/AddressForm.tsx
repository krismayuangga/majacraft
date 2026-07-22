"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navigation, Loader2 } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">Memuat peta...</div>,
});

type Region = { id: string; name: string };
const API_BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export interface AddressValue {
  province: string;
  provinceId: string;
  city: string;
  cityId: string;
  district: string;
  districtId: string;
  village: string;
  address: string;
  postalCode: string;
  phone?: string;
  lat: number;
  lng: number;
}

const DEFAULT: AddressValue = {
  province: "", provinceId: "", city: "", cityId: "",
  district: "", districtId: "", village: "",
  address: "", postalCode: "", phone: "",
  lat: -6.2088, lng: 106.8456,
};

interface Props {
  value: Partial<AddressValue>;
  onChange: (v: AddressValue) => void;
  showPhone?: boolean;
  showMap?: boolean;
}

export default function AddressForm({ value, onChange, showPhone = true, showMap = true }: Props) {
  const [form, setForm] = useState<AddressValue>({ ...DEFAULT, ...value });
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [loading, setLoading] = useState({ city: false, district: false, village: false });

  // Load provinces sekali
  useEffect(() => {
    fetch(`${API_BASE}/provinces.json`).then(r => r.json()).then((data: Region[]) => {
      setProvinces(data);
      // Auto-select province jika nama sudah ada di value
      if (value.province && !form.provinceId) {
        const match = data.find(p => p.name.toLowerCase() === value.province!.toLowerCase());
        if (match) {
          // Set provinceId dan load cities
          const updatedForm = { ...form, provinceId: match.id, province: match.name };
          setForm(updatedForm);
          // Load cities untuk provinsi ini
          fetch(`${API_BASE}/regencies/${match.id}.json`).then(r => r.json()).then((cityData: Region[]) => {
            setCities(cityData);
            // Auto-select city
            if (value.city) {
              const cityMatch = cityData.find(c => c.name.toLowerCase() === value.city!.toLowerCase());
              if (cityMatch) {
                setForm(f => ({ ...f, cityId: cityMatch.id, city: cityMatch.name }));
                // Load districts
                fetch(`${API_BASE}/districts/${cityMatch.id}.json`).then(r => r.json()).then((distData: Region[]) => {
                  setDistricts(distData);
                  // Auto-select district
                  if (value.district) {
                    const distMatch = distData.find(d => d.name.toLowerCase() === value.district!.toLowerCase());
                    if (distMatch) {
                      setForm(f => ({ ...f, districtId: distMatch.id, district: distMatch.name }));
                      // Load villages
                      fetch(`${API_BASE}/villages/${distMatch.id}.json`).then(r => r.json()).then((vilData: Region[]) => {
                        setVillages(vilData);
                      }).catch(() => {});
                    }
                  }
                }).catch(() => {});
              }
            }
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Sync dari parent value (saat edit)
  useEffect(() => {
    if (value.province && value.province !== form.province) {
      setForm(f => ({ ...f, ...value }));
    }
  }, [value.province]); // eslint-disable-line

  const update = (partial: Partial<AddressValue>) => {
    const next = { ...form, ...partial };
    setForm(next);
    onChange(next);
  };

  const onProvinceChange = async (id: string, name: string) => {
    update({ provinceId: id, province: name, cityId: "", city: "", district: "", districtId: "", village: "" });
    setCities([]); setDistricts([]); setVillages([]);
    if (!id) return;
    setLoading(l => ({ ...l, city: true }));
    const data = await fetch(`${API_BASE}/regencies/${id}.json`).then(r => r.json()).catch(() => []);
    setCities(data); setLoading(l => ({ ...l, city: false }));
  };

  const onCityChange = async (id: string, name: string) => {
    update({ cityId: id, city: name, district: "", districtId: "", village: "" });
    setDistricts([]); setVillages([]);
    if (!id) return;
    setLoading(l => ({ ...l, district: true }));
    const data = await fetch(`${API_BASE}/districts/${id}.json`).then(r => r.json()).catch(() => []);
    setDistricts(data); setLoading(l => ({ ...l, district: false }));
  };

  const onDistrictChange = async (id: string, name: string) => {
    update({ districtId: id, district: name, village: "" });
    setVillages([]);
    if (!id) return;
    setLoading(l => ({ ...l, village: true }));
    const data = await fetch(`${API_BASE}/villages/${id}.json`).then(r => r.json()).catch(() => []);
    setVillages(data); setLoading(l => ({ ...l, village: false }));
  };

  const onVillageChange = async (name: string) => {
    update({ village: name });
    // Auto geocode + kode pos
    if (name && form.district && form.city && form.province) {
      const q = [name, form.district, form.city, form.province, "Indonesia"].join(", ");
      setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=ID&addressdetails=1`, { headers: { "User-Agent": "MajaCraft/1.0" } });
          const d = await res.json();
          if (d[0]) {
            update({ village: name, lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), ...(!form.postalCode && d[0].address?.postcode ? { postalCode: d[0].address.postcode } : {}) });
          }
        } catch { /* ignore */ }
      }, 300);
    }
  };

  const geocode = async () => {
    const q = [form.address, form.village, form.district, form.city, form.province, "Indonesia"].filter(Boolean).join(", ");
    if (!q.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=ID&addressdetails=1`, { headers: { "User-Agent": "MajaCraft/1.0" } });
      const d = await res.json();
      if (d[0]) update({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), ...(!form.postalCode && d[0].address?.postcode ? { postalCode: d[0].address.postcode } : {}) });
    } catch { /* ignore */ }
  };

  const sel = "w-full px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-50";
  const inp = "w-full px-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-amber-500";

  return (
    <div className="space-y-3">
      {/* Provinsi */}
      <div>
        <label className="text-xs text-amber-600">Provinsi *</label>
        <select value={form.provinceId} onChange={e => onProvinceChange(e.target.value, e.target.options[e.target.selectedIndex].text)} className={`${sel} h-9 mt-0.5`}>
          <option value="">Pilih Provinsi</option>
          {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Kota */}
      <div>
        <label className="text-xs text-amber-600">Kota / Kabupaten *</label>
        <select value={form.cityId} onChange={e => onCityChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!form.provinceId || loading.city} className={`${sel} h-9 mt-0.5`}>
          <option value="">{loading.city ? "Memuat..." : "Pilih Kota/Kabupaten"}</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Kecamatan & Kelurahan */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-amber-600">Kecamatan</label>
          <select value={form.districtId} onChange={e => onDistrictChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!form.cityId || loading.district} className={`${sel} h-9 mt-0.5`}>
            <option value="">{loading.district ? "Memuat..." : "Pilih Kecamatan"}</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-amber-600">Kelurahan / Desa</label>
          <select value={form.village} onChange={e => onVillageChange(e.target.value)} disabled={!form.districtId || loading.village} className={`${sel} h-9 mt-0.5`}>
            <option value="">{loading.village ? "Memuat..." : "Pilih Kelurahan"}</option>
            {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Alamat & Kode Pos */}
      <div>
        <label className="text-xs text-amber-600">Alamat Jalan Lengkap *</label>
        <input type="text" placeholder="cth: Jl. Mawar No. 50 RT 03/RW 02" value={form.address} onChange={e => update({ address: e.target.value })} className={`${inp} h-9 mt-0.5`} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-amber-600">Kode Pos <span className="text-red-400">*</span></label>
          <input type="text" placeholder="cth: 61362" value={form.postalCode ?? ""} onChange={e => update({ postalCode: e.target.value })} className={`${inp} h-9 mt-0.5`} />
          <p className="text-[10px] text-amber-700 mt-0.5">Wajib untuk kalkulasi ongkir</p>
        </div>
        <div className="flex flex-col justify-start pt-0.5">
          <label className="text-xs text-amber-600 invisible">_</label>
          <button type="button" onClick={geocode} className="h-9 px-3 rounded-lg border border-amber-700/30 text-amber-600 hover:bg-amber-900/10 text-xs font-medium flex items-center gap-1.5 mt-0.5">
            <Navigation className="w-3.5 h-3.5" /> Temukan di Peta
          </button>
        </div>
      </div>

      {showPhone && (
        <div>
          <label className="text-xs text-amber-600">No. HP (untuk kurir pickup)</label>
          <input type="tel" placeholder="cth: 08xxxxxxxxxx" value={form.phone ?? ""} onChange={e => update({ phone: e.target.value })} className={`${inp} h-9 mt-0.5`} />
          <p className="text-[10px] text-muted-foreground mt-0.5">🔒 Tidak ditampilkan ke pembeli</p>
        </div>
      )}

      {showMap && (
        <div>
          <label className="text-xs text-amber-600 block mb-1">Pin Lokasi di Peta</label>
          <MapPicker lat={form.lat} lng={form.lng} onMove={(lat, lng) => update({ lat, lng })} />
          <p className="text-xs text-muted-foreground mt-1">Klik atau drag pin untuk sesuaikan lokasi</p>
        </div>
      )}
    </div>
  );
}
