import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/addresses — ambil semua alamat user
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const addresses = await prisma.address.findMany({
    where: { userId: session!.user!.id! },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return ok(addresses);
}

// POST /api/addresses — tambah alamat baru
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const body = await req.json();
  const { label, name, phone, address, city, province, zip, isDefault } = body;
  if (!name || !address || !city || !province || !zip)
    return err("Semua field wajib diisi");

  const userId = session!.user!.id!;

  // Jika isDefault, reset semua alamat lain
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  // Jika ini alamat pertama, jadikan default
  const count = await prisma.address.count({ where: { userId } });
  const addr = await prisma.address.create({
    data: { userId, label: label ?? "Rumah", name, phone: phone ?? "", address, city, province, zip, isDefault: isDefault || count === 0 },
  });
  return ok(addr, 201);
}
