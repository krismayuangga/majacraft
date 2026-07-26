import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

const MAX_SIZE     = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Upload file lokal dan return URL path */
async function saveFile(file: File, folder: string): Promise<string> {
  if (file.size > MAX_SIZE) throw new Error("File terlalu besar (maks 10MB)");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Format tidak didukung. Gunakan JPG atau PNG");
  const ext      = extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const dir      = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${filename}`;
}

/**
 * POST /api/users/kyc — submit dokumen KYC
 *
 * Mendukung dua mode:
 *
 * MODE 1 — JSON (web app, file sudah diupload via /api/upload):
 *   Content-Type: application/json
 *   Body: { ktpUrl: string, selfieUrl: string, nik?: string }
 *
 * MODE 2 — Multipart (mobile app, file langsung dikirim):
 *   Content-Type: multipart/form-data
 *   Fields: kycNik (string), kycKtp (File), kycSelfie (File)
 *   Alternatif field names: ktp_file / selfie_file / nik
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;

  let ktpUrl:    string | undefined;
  let selfieUrl: string | undefined;
  let nik:       string | undefined;

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      // MODE 2: Mobile — multipart dengan file
      const form   = await req.formData();
      const ktpFile    = (form.get("kycKtp") || form.get("ktp_file") || form.get("ktpFile")) as File | null;
      const selfieFile = (form.get("kycSelfie") || form.get("selfie_file") || form.get("selfieFile")) as File | null;
      nik = String(form.get("kycNik") || form.get("nik") || "").trim() || undefined;

      if (!ktpFile || ktpFile.size === 0) return err("File KTP wajib dikirim (field: kycKtp)", 400);
      if (!selfieFile || selfieFile.size === 0) return err("File selfie wajib dikirim (field: kycSelfie)", 400);

      [ktpUrl, selfieUrl] = await Promise.all([
        saveFile(ktpFile, "kyc"),
        saveFile(selfieFile, "kyc"),
      ]);
    } else {
      // MODE 1: Web — JSON body dengan URL yang sudah diupload
      const body = await req.json();
      ktpUrl    = body.ktpUrl;
      selfieUrl = body.selfieUrl;
      nik       = body.nik;
    }
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : "Gagal memproses request";
    return err(msg, 400);
  }

  if (!ktpUrl || !selfieUrl) {
    return err("Foto KTP dan selfie wajib diupload", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } });
  if (!user) return err("Pengguna tidak ditemukan", 404);

  if (user.kycStatus === "VERIFIED") return err("Akun Anda sudah terverifikasi");
  if (user.kycStatus === "PENDING")  return err("Dokumen Anda sedang dalam proses verifikasi");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus:    "PENDING",
      kycKtpUrl:    ktpUrl,
      kycSelfieUrl: selfieUrl,
      ...(nik && { kycNik: nik }),
    },
    select: { id: true, kycStatus: true },
  });

  return ok({
    userId:     updated.id,
    kycStatus:  updated.kycStatus,
    message:    "Dokumen berhasil dikirim, menunggu verifikasi admin",
  });
}

// GET /api/users/kyc — cek status KYC
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, kycVerifiedAt: true, kycKtpUrl: true, kycSelfieUrl: true },
  });

  return ok(user);
}
