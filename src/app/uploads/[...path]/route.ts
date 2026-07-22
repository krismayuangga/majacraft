import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, normalize } from "path";
import { existsSync } from "fs";

const MIME: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

// GET /uploads/[...path] — serve uploaded files dari public/uploads secara dinamis
// (Next.js 16+ tidak auto-serve file yang diupload setelah build)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Sanitize path — cegah path traversal attack
  const relativePath = path.join("/").replace(/\.\./g, "").replace(/^\/+/, "");
  const normalized = normalize(relativePath);

  // Hanya izinkan akses ke folder uploads
  if (!normalized || normalized.startsWith("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = join(process.cwd(), "public", "uploads", normalized);

  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
