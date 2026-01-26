import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const body = await request.json().catch(() => null);
  let phone = body?.phone?.toString()?.trim() ?? "";
  const password = body?.password?.toString()?.trim() ?? "";

  if (!phone || !password) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (!phone.startsWith("+998")) {
    phone = `+998${phone.replace(/^\+?998/, "")}`;
  }

  const db = getDb();
  const customer = db
    .prepare("SELECT id, name, phone, password FROM customers WHERE phone = ?")
    .get(phone) as { id?: number; name?: string; phone?: string | null; password?: string | null } | undefined;

  if (!customer?.id || !customer.password || customer.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    item: { id: customer.id, name: customer.name, phone: customer.phone ?? null },
  });
}