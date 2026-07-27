/**
 * Firebase Cloud Messaging (FCM) via Firebase Admin SDK
 * Digunakan untuk push notification ke Flutter mobile app.
 *
 * Env vars yang diperlukan:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (dengan \n sebagai newline)
 *
 * Jika env vars tidak diset, semua fungsi di-skip secara diam-diam.
 */

import { prisma } from "@/lib/prisma";

let _app: import("firebase-admin/app").App | null = null;

function getFirebaseApp() {
  if (_app) return _app;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  try {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const existing = getApps();
    if (existing.length > 0) { _app = existing[0]; return _app; }
    _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return _app;
  } catch (e) {
    console.error("[FCM] initializeApp error:", e);
    return null;
  }
}

/** Kirim push ke satu FCM token */
export async function sendFCM(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const app = getFirebaseApp();
  if (!app) return; // Firebase belum dikonfigurasi, skip diam-diam

  try {
    const { getMessaging } = require("firebase-admin/messaging");
    await getMessaging(app).send({
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: params.data ?? {},
      android: { priority: "high", notification: { sound: "default" } },
      apns:    { payload: { aps: { sound: "default" } } },
    });
  } catch (e: any) {
    // Token invalid / expired → nonaktifkan
    if (e?.code === "messaging/registration-token-not-registered" ||
        e?.code === "messaging/invalid-registration-token") {
      await prisma.pushDevice.updateMany({
        where: { token: params.token },
        data: { isActive: false },
      }).catch(() => {});
    } else {
      console.error("[FCM] send error:", e?.message ?? e);
    }
  }
}

/** Kirim push ke semua device aktif milik userId */
export async function sendFCMToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const app = getFirebaseApp();
  if (!app) return;

  const devices = await prisma.pushDevice.findMany({
    where: { userId, isActive: true },
    select: { token: true },
  });

  // Hanya kirim ke FCM token (bukan Expo token)
  const fcmDevices = devices.filter(d => !d.token.startsWith("ExponentPushToken["));
  await Promise.all(fcmDevices.map(d => sendFCM({ token: d.token, title, body, data })));
}

/** Cek apakah Firebase sudah dikonfigurasi */
export function isFCMConfigured(): boolean {
  return !!(process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY);
}
