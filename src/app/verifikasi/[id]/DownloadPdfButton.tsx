"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

export function DownloadPdfButton({ certId }: { certId: string }) {
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    setLoading(true);
    const prev = document.title;
    document.title = `Sertifikat-${certId}`;
    setTimeout(() => {
      window.print();
      document.title = prev;
      setLoading(false);
    }, 100);
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
    >
      <FileDown className="w-4 h-4" />
      {loading ? "Mempersiapkan..." : "Download PDF"}
    </button>
  );
}
