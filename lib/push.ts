import "server-only";

import webpush from "web-push";

import { getDb } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

function initWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return true;
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToAll(payload: PushPayload) {
  if (!initWebPush()) return { ok: false, error: "PUSH_NOT_CONFIGURED" as const };

  const db = getDb();
  const subs = db
    .prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions ORDER BY id DESC")
    .all() as Array<{ id: number; endpoint: string; p256dh: string; auth: string }>;

  const body = JSON.stringify(payload);
  const removeStmt = db.prepare("DELETE FROM push_subscriptions WHERE id = ?");

  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          } as any,
          body
        );
        sent += 1;
      } catch (error: any) {
        const statusCode = Number(error?.statusCode ?? 0);
        if (statusCode === 404 || statusCode === 410) {
          removeStmt.run(sub.id);
          removed += 1;
          return;
        }
      }
    })
  );

  return { ok: true as const, sent, removed };
}

