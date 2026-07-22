import Link from "next/link";
import { Briefcase, MapPin, Clock, ChevronRight, Users } from "lucide-react";

const openings = [
  {
    title: "Kurator Seni & Kerajinan Tradisional",
    dept: "Kurasi",
    type: "Full-time / Part-time",
    location: "Remote / Seluruh Indonesia",
    desc: "Menyeleksi, memverifikasi, dan mendokumentasikan karya seni dan kerajinan tradisional dari seniman lokal. Anda akan menjadi jembatan antara komunitas pengrajin dan platform MajaCraft.",
    skills: ["Pengetahuan seni & kerajinan Nusantara", "Riset budaya lokal", "Komunikasi", "Fotografi produk"],
  },
  {
    title: "Koordinator Komunitas Seniman",
    dept: "Komunitas",
    type: "Full-time",
    location: "Remote / Regional",
    desc: "Membangun dan merawat komunitas seniman di berbagai daerah. Mendampingi pengrajin baru bergabung ke MajaCraft, menyelenggarakan workshop onboarding, dan menjadi wakil komunitas di daerah masing-masing.",
    skills: ["Kemampuan fasilitasi komunitas", "Pengalaman organisasi seni/budaya", "Public speaking", "Jaringan komunitas lokal"],
  },
  {
    title: "Penulis Konten Budaya & Storytelling",
    dept: "Konten",
    type: "Full-time / Freelance",
    location: "Remote",
    desc: "Menggali dan menuliskan cerita di balik setiap karya dan pengrajin. Konten Anda akan menjadi jiwa dari setiap produk di MajaCraft — menghubungkan pembeli dengan nilai budaya yang terkandung dalam karya.",
    skills: ["Penulisan narasi/storytelling", "Riset budaya & sejarah lokal", "SEO konten", "Fotografi atau videografi ringan"],
  },
  {
    title: "Manajer Pameran & Event Budaya",
    dept: "Event",
    type: "Full-time",
    location: "Yogyakarta / Jakarta",
    desc: "Merancang dan mengeksekusi pameran seni virtual maupun fisik, festival kerajinan, dan kolaborasi dengan institusi budaya. Anda akan membawa karya-karya MajaCraft ke panggung yang lebih luas.",
    skills: ["Manajemen event", "Jaringan institusi budaya/museum", "Koordinasi lintas tim", "Media sosial & publikasi"],
  },
  {
    title: "Brand Ambassador Daerah",
    dept: "Komunitas",
    type: "Part-time / Freelance",
    location: "Seluruh Indonesia (berbasis daerah)",
    desc: "Mewakili dan memperkenalkan MajaCraft di komunitas seni dan kerajinan di daerah Anda. Mendampingi pengrajin lokal untuk bergabung dan berkembang bersama platform.",
    skills: ["Aktif di komunitas seni/kerajinan lokal", "Komunikasi & jaringan", "Passion terhadap budaya daerah"],
  },
  {
    title: "Mitra Fotografer Karya Seni",
    dept: "Konten",
    type: "Freelance / Per-Proyek",
    location: "Remote / Kunjungan Lapangan",
    desc: "Mendokumentasikan karya seni dan kerajinan milik pengrajin yang belum memiliki peralatan fotografi memadai. Hasil foto digunakan untuk menampilkan karya secara profesional di platform.",
    skills: ["Fotografi produk & seni", "Editing foto", "Kesediaan kunjungan lapangan", "Kepekaan estetika budaya"],
  },
];

const culture = [
  { emoji: "🎨", title: "Cinta Budaya", desc: "Kami bekerja dengan satu tujuan — melestarikan warisan budaya Nusantara." },
  { emoji: "🤝", title: "Dampak Nyata", desc: "Setiap peran berkontribusi langsung pada penghidupan pengrajin Indonesia." },
  { emoji: "🌏", title: "Fleksibel & Remote", desc: "Bekerja dari mana saja, termasuk langsung dari komunitas seni daerah Anda." },
  { emoji: "🌱", title: "Tumbuh Bersama", desc: "Platform yang berkembang pesat dengan ruang belajar dan berkarya tak terbatas." },
];

const deptColors: Record<string, string> = {
  Kurasi: "text-amber-400 bg-amber-900/20 border-amber-800/30",
  Komunitas: "text-green-400 bg-green-900/20 border-green-800/30",
  Konten: "text-purple-400 bg-purple-900/20 border-purple-800/30",
  Event: "text-blue-400 bg-blue-900/20 border-blue-800/30",
};

export default function Karir() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Briefcase className="w-3 h-3" /> Bergabung Bersama Kami
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Karir di MajaCraft</h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Kami mencari pegiat seni, komunitas budaya, kurator, dan storyteller yang bersemangat melestarikan kekayaan kerajinan Nusantara. Bukan sekadar pekerjaan — ini adalah gerakan budaya.
        </p>
      </div>

      {/* Culture */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        {culture.map((c, i) => (
          <div key={i} className="p-4 rounded-xl border border-amber-800/20 bg-amber-900/10 text-center">
            <p className="text-2xl mb-2">{c.emoji}</p>
            <p className="text-sm font-semibold text-foreground mb-1">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Job Openings */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">Posisi Terbuka</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {openings.length} posisi tersedia
          </div>
        </div>
        <div className="space-y-4">
          {openings.map((job, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card hover:border-amber-700/40 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${deptColors[job.dept] ?? "text-muted-foreground bg-muted border-border"}`}>
                      {job.dept}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {job.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{job.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.skills.map((skill, j) => (
                  <span key={j} className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-md">{skill}</span>
                ))}
              </div>
              <Link
                href={`/kontak?subject=Lamaran: ${encodeURIComponent(job.title)}`}
                className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-500 text-sm font-medium transition-colors"
              >
                Lamar Sekarang <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Open Application */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Punya keahlian lain yang relevan?</p>
        <p className="text-sm text-muted-foreground mb-4">
          Jika Anda seorang pegiat budaya, pengajar seni, atau aktivis komunitas kerajinan yang ingin berkontribusi — kami ingin mendengar cerita Anda.
        </p>
        <Link href="/kontak?subject=Open%20Application%20Pegiat%20Budaya" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          Kirim Perkenalan Diri <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
