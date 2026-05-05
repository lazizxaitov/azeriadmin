import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const phoneInput = url.searchParams.get("phone")?.toString().trim() ?? "";
  if (!phoneInput) {
    return NextResponse.json({ items: [] });
  }

  const digitsRaw = phoneInput.replace(/\D/g, "");
  if (!digitsRaw) return NextResponse.json({ items: [] });

  const variants = new Set<string>();
  variants.add(digitsRaw);
  if (digitsRaw.length === 9 && !digitsRaw.startsWith("998")) {
    variants.add(`998${digitsRaw}`);
  }
  if (digitsRaw.startsWith("998")) {
    variants.add(digitsRaw.slice(3));
  }

  const db = getDb();
  const patterns = Array.from(variants)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((value) => `%${value}%`);

  const where =
    patterns.length === 1
      ? "REPLACE(COALESCE(phone, ''), '+', '') LIKE ?"
      : patterns.map(() => "REPLACE(COALESCE(phone, ''), '+', '') LIKE ?").join(" OR ");

  const items = db
    .prepare(
      `SELECT id, name, phone, bonus_balance, birth_date
       FROM customers
       WHERE ${where}
       ORDER BY updated_at DESC
       LIMIT 10`
    )
    .all(...patterns);

  return NextResponse.json({ items });
}
