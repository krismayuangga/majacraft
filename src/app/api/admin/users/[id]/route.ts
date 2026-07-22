import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — update status/role user
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "role", "kycStatus"] as const;
  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const user = await prisma.user.update({ where: { id }, data });
  return ok(user);
}
