import { prisma } from "@/lib/prisma";
import { sendFCM } from "@/lib/fcm";

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function sendExpoPush(messages: PushPayload[]) {
  if (messages.length === 0) return;

  const chunks: PushPayload[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        chunk.map((msg) => ({
          to: msg.to,
          title: msg.title,
          body: msg.body,
          sound: "default",
          data: msg.data ?? {},
        }))
      ),
    }).catch((e) => {
      console.error("[push send error]", e);
    });
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const devices = await prisma.pushDevice.findMany({
    where: { userId, isActive: true },
    select: { id: true, token: true },
  });

  if (devices.length === 0) return;

  // Expo tokens (React Native)
  const expoDevices = devices.filter((d) => d.token.startsWith("ExponentPushToken["));
  if (expoDevices.length > 0) {
    await sendExpoPush(expoDevices.map((d) => ({ to: d.token, title, body, data })));
  }

  // FCM tokens (Flutter)
  const fcmDevices = devices.filter((d) => !d.token.startsWith("ExponentPushToken["));
  const stringData = data
    ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")]))
    : undefined;
  await Promise.all(fcmDevices.map((d) => sendFCM({ token: d.token, title, body, data: stringData }).catch(() => {})));
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (userIds.length === 0) return;

  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds }, isActive: true },
    select: { token: true },
  });

  if (devices.length === 0) return;

  const allTokens = [...new Set(devices.map((d) => d.token))];

  // Expo tokens
  const expoTokens = allTokens.filter((t) => t.startsWith("ExponentPushToken["));
  if (expoTokens.length > 0) {
    await sendExpoPush(expoTokens.map((to) => ({ to, title, body, data })));
  }

  // FCM tokens
  const fcmTokens = allTokens.filter((t) => !t.startsWith("ExponentPushToken["));
  const stringData = data
    ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")]))
    : undefined;
  await Promise.all(fcmTokens.map((t) => sendFCM({ token: t, title, body, data: stringData }).catch(() => {})));
}
