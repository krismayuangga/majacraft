'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Shield, Zap } from 'lucide-react';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [buildInfo, setBuildInfo] = useState({
    version: '1.0.0',
    size: '~45 MB',
    lastUpdate: new Date().toLocaleDateString('id-ID'),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Trigger download
      const link = document.createElement('a');
      link.href = '/api/mobile/download';
      link.download = 'MajaCraft.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Track download event (optional)
      // await fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify({ event: 'apk_download' }) });
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh APK. Silakan coba lagi.');
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MajaCraft</h1>
                <p className="text-xs text-gray-600">Mobile App</p>
              </div>
            </div>
            <a
              href="https://majacraft.id"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Kembali ke Website
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            📱 Download Gratis
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Download Aplikasi<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MajaCraft Mobile
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Belanja produk kerajinan lokal langsung dari smartphone Anda. 
            Mudah, cepat, dan aman.
          </p>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Download className="w-6 h-6" />
            {downloading ? 'Mengunduh...' : 'Download APK'}
          </button>

          {/* Build Info */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <span>📦 Version {buildInfo.version}</span>
            <span>💾 {buildInfo.size}</span>
            <span>📅 {buildInfo.lastUpdate}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performa Cepat</h3>
            <p className="text-gray-600 text-sm">
              Dioptimalkan untuk Android dengan loading yang sangat cepat
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aman & Terpercaya</h3>
            <p className="text-gray-600 text-sm">
              Data Anda dilindungi dengan enkripsi end-to-end
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mudah Digunakan</h3>
            <p className="text-gray-600 text-sm">
              Interface intuitif yang mudah dipahami untuk semua pengguna
            </p>
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Cara Install</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Download APK</h4>
                <p className="text-gray-600 text-sm">
                  Klik tombol "Download APK" di atas untuk mengunduh file installer
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Izinkan Install dari Sumber Tidak Dikenal</h4>
                <p className="text-gray-600 text-sm">
                  Buka Settings → Security → aktifkan "Unknown Sources" atau "Install from Unknown Sources"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Buka File APK</h4>
                <p className="text-gray-600 text-sm">
                  Buka file "MajaCraft.apk" yang sudah didownload, lalu tap "Install"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Selesai!</h4>
                <p className="text-gray-600 text-sm">
                  Aplikasi sudah terinstall. Buka MajaCraft dan mulai berbelanja!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Catatan:</strong> APK ini belum tersedia di Google Play Store. 
              Pastikan Anda download dari link resmi majacraft.id/download
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2026 MajaCraft. Platform marketplace kerajinan lokal Indonesia.</p>
          <p className="mt-2">
            Butuh bantuan? Hubungi{' '}
            <a href="mailto:halo@majacraft.id" className="text-blue-600 hover:underline">
              halo@majacraft.id
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
