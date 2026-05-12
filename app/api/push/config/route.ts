import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey() || null,
  });
}

