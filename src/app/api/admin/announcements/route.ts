import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { sendPushToUsers } from "@/lib/push";

/**
 * POST /api/admin/announcements
 * Kirim pengumuman (broadcast notification) ke semua user atau berdasarkan role.
 *
 * Body: { title: string, message: string, target: "all" | "buyer" | "seller" }
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const title   = String(body.title   ?? "").trim();
  const message = String(body.message ?? "").trim();
  const target  = String(body.target  ?? "all").toLowerCase();

  if (!title)   return err("Judul wajib diisi", 400);
  if (!message) return err("Isi pesan wajib diisi", 400);
  if (title.length > 100)   return err("Judul maksimal 100 karakter", 400);
  if (message.length > 500) return err("Pesan maksimal 500 karakter", 400);
  if (!["all", "buyer", "seller"].includes(target)) return err("Target tidak valid", 400);

  // Ambil user sesuai target
  const roleFilter =
    target === "buyer"  ? { role: "BUYER"  as const } :
    target === "seller" ? { role: "SELLER" as const } :
    undefined;

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", ...(roleFilter ?? {}) },
    select: { id: true },
  });

  if (users.length === 0) return err("Tidak ada user yang sesuai target", 404);

  const userIds = users.map(u => u.id);

  // Buat notification record untuk semua user (batch)
  await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      type:   "system",
      title,
      body:   message,
      isRead: false,
      data:   { type: "system", source: "announcement" },
    })),
  });

  // Kirim FCM push notification (fire-and-forget, tidak blocking)
  sendPushToUsers(userIds, title, message, {
    type: "system",
    source: "announcement",
  }).catch(e => console.error("[announcements] push error:", e));

  console.log(`[announcements] Sent to ${users.length} users (target: ${target})`);

  return ok({ sent: users.length, target, title });
}
