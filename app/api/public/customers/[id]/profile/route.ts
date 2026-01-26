import { NextRequest, NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const customerId = Number((await params).id);
  if (!Number.isFinite(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  const db = getDb();
  const customer = db
    .prepare("SELECT id, name, phone FROM customers WHERE id = ?")
    .get(customerId) as { id?: number; name?: string; phone?: string | null } | undefined;

  if (!customer?.id) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: { id: customer.id, name: customer.name, phone: customer.phone ?? null },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const customerId = Number((await params).id);
  if (!Number.isFinite(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.toString()?.trim();
  const phone = body?.phone?.toString()?.trim();

  if (!name && !phone) {
    return NextResponse.json({ error: "No data" }, { status: 400 });
  }

  const db = getDb();
  const customer = db
    .prepare("SELECT id FROM customers WHERE id = ?")
    .get(customerId) as { id?: number } | undefined;

  if (!customer?.id) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (phone) {
    const existing = db
      .prepare("SELECT id FROM customers WHERE phone = ? AND id != ?")
      .get(phone, customerId) as { id?: number } | undefined;
    if (existing?.id) {
      return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
    }
  }

  const updates: string[] = [];
  const paramsList: Array<string | number | null> = [];

  if (name) {
    updates.push("name = ?");
    paramsList.push(name);
  }
  if (phone) {
    updates.push("phone = ?");
    paramsList.push(phone);
  }
  updates.push("updated_at = ?");
  paramsList.push(nowIso());

  paramsList.push(customerId);

  db.prepare(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`).run(
    ...paramsList
  );

  const updated = db
    .prepare("SELECT id, name, phone FROM customers WHERE id = ?")
    .get(customerId);

  return NextResponse.json({ item: updated });
}