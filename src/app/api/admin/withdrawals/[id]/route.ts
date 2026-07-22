import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildWithdrawalEmail } from "@/lib/email";

// PATCH /api/admin/withdrawals/[id] — approve/reject/transferred
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { status, adminNote } = await req.json();

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: { store: { select: { userId: true, name: true, user: { select: { email: true } } } } },
  });
  if (!withdrawal) return err("Tidak ditemukan", 404);

  await prisma.withdrawal.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote ?? withdrawal.adminNote,
      ...(status === "TRANSFERRED" && { processedAt: new Date() }),
    },
  });

  // Notifikasi ke seller
  const notifMap: Record<string, { title: string; body: string }> = {
    APPROVED: { title: "Pencairan Disetujui ✅", body: `Pencairan Rp ${withdrawal.netAmount.toLocaleString("id-ID")} dari toko ${withdrawal.store.name} disetujui. Dana akan segera ditransfer.` },
    REJECTED: { title: "Pencairan Ditolak ⚠️", body: `Pencairan dari toko ${withdrawal.store.name} ditolak.${adminNote ? ` Alasan: ${adminNote}` : ""}` },
    TRANSFERRED: { title: "Dana Sudah Ditransfer 💰", body: `Dana Rp ${withdrawal.netAmount.toLocaleString("id-ID")} telah ditransfer ke rekening Anda. Mohon cek dalam 1x24 jam.` },
  };

  if (notifMap[status]) {
    await createNotification({
      userId: withdrawal.store.userId,
      type: "system",
      title: notifMap[status].title,
      body: notifMap[status].body,
      data: { withdrawalId: id },
    });

    // Email ke seller
    const sellerEmail = withdrawal.store.user?.email;
    if (sellerEmail && ["APPROVED", "REJECTED", "TRANSFERRED"].includes(status)) {
      sendEmail({
        to: sellerEmail,
        subject: `[MajaCraft] ${notifMap[status].title}`,
        html: buildWithdrawalEmail(
          withdrawal.netAmount,
          status as "APPROVED" | "REJECTED" | "TRANSFERRED",
          adminNote
        ),
      }).catch(e => console.error("[email withdrawal]", e));
    }
  }

  return ok({ message: "Status diperbarui" });
}
