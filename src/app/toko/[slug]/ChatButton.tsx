"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
  storeSlug: string;
  storeName: string;
  storeUserId: string;
}

export default function ChatButton({ storeUserId, storeName }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Jangan tampilkan tombol jika user adalah pemilik toko itu sendiri
  const isSelf = session?.user?.id === storeUserId;
  if (isSelf) return null;

  async function handleChat() {
    if (!session) {
      router.push("/masuk?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUserId: storeUserId }),
      });
      const data = await res.json();
      const chatId = data.data?.id;
      if (chatId) {
        router.push(`/chat?id=${chatId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-600/40 text-amber-400 text-sm font-medium hover:bg-amber-900/20 transition-colors disabled:opacity-50 w-full justify-center"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Chat dengan {storeName}
    </button>
  );
}
