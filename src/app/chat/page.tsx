"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Send, ArrowLeft, ShieldCheck, Package, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { formatRupiah } from "@/lib/data";

type OtherUser = { id: string; name: string | null; image: string | null };

type ProductSnippet = { id: string; name: string; slug: string; price: number; image: string | null };

type ChatSummary = {
  id: string;
  productName: string | null;
  product: ProductSnippet | null;
  otherUser: OtherUser | null;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  createdAt: string;
};

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isBlocked: boolean;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: localeId });
  } catch {
    return "";
  }
}

function shortTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPage() {
  return (
    // overflow-hidden mencegah outer page scroll saat chat di-render
    <div className="overflow-hidden" style={{ height: "calc(100vh - 4rem)", marginBottom: 0 }}>
      <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}>
        <ChatPageInner />
      </Suspense>
    </div>
  );
}

function ChatPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("id");

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [warning, setWarning] = useState("");
  const [search, setSearch] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCountRef = useRef(0); // track jumlah pesan sebelumnya

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.data ?? []);
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.data ?? []);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startPolling = useCallback((chatId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(chatId);
      fetchInbox();
    }, 5000);
  }, [fetchMessages, fetchInbox]);

  useEffect(() => {
    // Tunggu session siap sebelum fetch
    if (status === "loading") return;
    if (status === "unauthenticated") { setLoadingInbox(false); return; }
    fetchInbox();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchInbox, status]);

  useEffect(() => {
    if (preselectedId && !activeChatId) {
      setActiveChatId(preselectedId);
    }
  }, [preselectedId, activeChatId]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      startPolling(activeChatId);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      setMessages([]);
    }
  }, [activeChatId, fetchMessages, startPolling]);

  useEffect(() => {
    // Hanya auto-scroll ke bawah jika ada PESAN BARU (bukan polling update yang sama)
    const newCount = messages.length;
    const oldCount = prevMsgCountRef.current;
    if (newCount > oldCount) {
      // Scroll container chat, bukan window
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    prevMsgCountRef.current = newCount;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || sending) return;
    setWarning("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${activeChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWarning(data.error ?? "Gagal mengirim pesan");
        return;
      }
      if (data.data?.blocked) {
        setWarning("⚠️ Pesan diblokir: tidak boleh membagikan kontak pribadi");
      }
      setInput("");
      await fetchMessages(activeChatId);
      await fetchInbox();
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter(c =>
    c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const userId = session?.user?.id;

  return (
    <div className="max-w-5xl mx-auto flex overflow-hidden rounded-xl border border-border bg-card h-full">    

      {/* Sidebar */}
      <div className={`${activeChatId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Pesan</h2>
            <button onClick={fetchInbox} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Cari percakapan..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-gold">
          {loadingInbox ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm px-4">
              <p>Belum ada percakapan</p>
              <p className="mt-2 text-xs">Kunjungi halaman toko dan klik &quot;Chat Penjual&quot;</p>
            </div>
          ) : filteredChats.map((chat) => {
            const other = chat.otherUser;
            const initial = other?.name?.[0]?.toUpperCase() ?? "?";
            const isActive = chat.id === activeChatId;
            return (
              <button key={chat.id} onClick={() => setActiveChatId(chat.id)}
                className={`w-full flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/30 ${isActive ? "bg-amber-900/10 border-l-2 border-l-amber-500" : ""}`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                  {other?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.image} alt={other.name ?? ""} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-amber-400">{initial}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground truncate">{other?.name ?? "Pengguna"}</p>
                    {chat.lastMessage && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">{timeAgo(chat.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  {chat.productName && (
                    <p className="text-xs text-amber-700 truncate">{chat.productName}</p>
                  )}
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage?.content ?? "Mulai percakapan..."}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 ml-1">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Area Chat */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80">
            <button onClick={() => setActiveChatId(null)} className="md:hidden text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-900/30 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                {activeChat?.otherUser?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeChat.otherUser.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-amber-400">
                    {activeChat?.otherUser?.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {activeChat?.otherUser?.name ?? "Pengguna"}
              </p>
            </div>
            {activeChat?.productName && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-900/10 border border-amber-800/20 text-xs text-amber-600 max-w-[160px]">
                <Package className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{activeChat.productName}</span>
              </div>
            )}
          </div>

          {/* Product snippet — muncul saat chat dimulai dari halaman produk */}
          {activeChat?.product && (
            <div className="mx-4 mt-3 flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {activeChat.product.image && (
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                  <Image src={activeChat.product.image} alt={activeChat.product.name} width={56} height={56} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Ditanyakan tentang</p>
                <p className="text-sm font-semibold text-foreground truncate">{activeChat.product.name}</p>
                <p className="text-sm font-bold text-amber-700">{formatRupiah(activeChat.product.price)}</p>
              </div>
              <Link href={`/produk/${activeChat.product.slug}`} target="_blank"
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat
              </Link>
            </div>
          )}

          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-900/10 border border-amber-800/20 text-xs text-amber-700">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Chat dilindungi platform. Dilarang membagikan nomor HP atau kontak pribadi.</span>
          </div>

          {/* Quick reply templates — muncul saat belum ada pesan */}
          {messages.length === 0 && activeChat?.product && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Pesan cepat:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  `Apakah ${activeChat.product.name} masih tersedia?`,
                  "Berapa harga terbaik untuk produk ini?",
                  "Apakah bisa dikirim ke luar kota?",
                  "Apakah bisa custom/request?",
                  "Berapa estimasi pengiriman ke Surabaya?",
                ].map((tmpl) => (
                  <button key={tmpl} onClick={() => setInput(tmpl)}
                    className="text-xs px-3 py-1.5 rounded-full border border-amber-700/40 text-amber-700 hover:bg-amber-900/10 transition-colors text-left">
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-gold px-4 py-4 space-y-3">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Belum ada pesan. Mulai percakapan!
              </div>
            ) : messages.map((msg) => {
              const isMe = msg.senderId === userId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-amber-900/30 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                      <span className="text-xs font-bold text-amber-400">
                        {activeChat?.otherUser?.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className="max-w-[75%] space-y-1">
                    <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isBlocked
                        ? "bg-red-900/20 border border-red-800/30 text-red-400 italic"
                        : isMe
                          ? "bg-amber-700 text-white rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}>
                      {msg.isBlocked ? "[Pesan diblokir]" : msg.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground ${isMe ? "text-right" : "text-left"}`}>
                      {shortTime(msg.createdAt)}
                      {isMe && (msg.readAt ? " ✓✓" : " ✓")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {warning && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-xs">
              {warning}
            </div>
          )}

          <div className="px-4 py-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={input}
                onChange={(e) => { setInput(e.target.value); setWarning(""); }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 h-11 px-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-xl bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-900/20 border border-amber-800/30 flex items-center justify-center">
            <Send className="w-7 h-7 text-amber-700" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Pilih percakapan</p>
            <p className="text-muted-foreground text-sm mt-1">Pilih chat dari daftar untuk mulai berkirim pesan</p>
          </div>
        </div>
      )}
    </div>
  );
}
