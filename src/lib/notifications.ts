import { prisma } from "@/lib/prisma";

export type NotifType =
  | "product_published"
  | "product_moderated"
  | "product_rejected"
  | "new_order"
  | "order_status"
  | "new_chat"
  | "dispute_created"
  | "dispute_seller_responded"
  | "dispute_escalated"
  | "dispute_admin_assigned"
  | "dispute_resolved"
  | "dispute_cancelled"
  | "dispute_update"
  | "system";

export async function createNotification({
  userId, type, title, body, data,
}: {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { userId, type, title, body, data: (data ?? {}) as any },
  });
}

export async function createNotificationBulk(notifications: {
  userId: string; type: NotifType; title: string; body: string; data?: Record<string, unknown>;
}[]) {
  return prisma.notification.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: notifications.map(n => ({ ...n, data: (n.data ?? {}) as any })),
  });
}
