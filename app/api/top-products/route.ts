import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const items = db
    .prepare(
      `SELECT tp.product_id, tp.sort_order, p.title_ru, p.title_uz, p.price, p.is_active
       FROM top_products tp
       JOIN products p ON p.id = tp.product_id
       ORDER BY tp.sort_order ASC`
    )
    .all();

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items: Array<{ productId?: number; sortOrder?: number }> = Array.isArray(
    body?.items
  )
    ? body.items
    : [];

  const db = getDb();
  const update = db.transaction(() => {
    db.prepare("DELETE FROM top_products").run();
    const insert = db.prepare(
      "INSERT INTO top_products (product_id, sort_order) VALUES (?, ?)"
    );
    items.forEach((item, index: number) => {
      const productId = Number(item?.productId);
      const sortOrder = Number(item?.sortOrder ?? index);
      if (productId) {
        insert.run(productId, sortOrder);
      }
    });
  });

  update();
  return NextResponse.json({ ok: true });
}
