import { NextResponse } from "next/server";

import { parseBirthDateToIso } from "@/lib/birth-date";
import { getDb, nowIso } from "@/lib/db";
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
  const name = body?.name?.toString()?.trim();
  let phone = body?.phone?.toString()?.trim() ?? "";
  const password = body?.password?.toString()?.trim();
  const birthDateRaw = body?.birthDate?.toString()?.trim() ?? "";

  if (!name || !phone || !password) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (!phone.startsWith("+998")) {
    phone = `+998${phone.replace(/^\+?998/, "")}`;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM customers WHERE phone = ?")
    .get(phone) as { id?: number } | undefined;
  if (existing?.id) {
    return NextResponse.json({ error: "Phone already exists" }, { status: 409 });
  }

  const now = nowIso();
  const birthDate = parseBirthDateToIso(birthDateRaw);
  const result = db
    .prepare(
      "INSERT INTO customers (name, phone, password, birth_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, phone, password, birthDate, now, now);

  return NextResponse.json({ id: result.lastInsertRowid });
}
