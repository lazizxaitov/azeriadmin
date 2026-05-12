import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb, nowIso } from "@/lib/db";
import { isPushConfigured } from "@/lib/push";

export const runtime = "nodejs";

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(request: Request) {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => null)) as SubscriptionInput | null;
  const endpoint = body?.endpoint?.toString()?.trim();
  const p256dh = body?.keys?.p256dh?.toString()?.trim();
  const auth = body?.keys?.auth?.toString()?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(endpoint, p256dh, auth, nowIso());

  return NextResponse.json({ ok: true });
}

