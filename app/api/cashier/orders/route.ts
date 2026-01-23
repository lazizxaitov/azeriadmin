import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getCashierSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCashierSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const orders = db
    .prepare(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        ca.address_line, ca.comment as address_comment, ca.label as address_label,
        cr.name as courier_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN customer_addresses ca ON ca.id = o.customer_address_id
       LEFT JOIN couriers cr ON cr.id = o.courier_id
       ORDER BY o.created_at DESC`
    )
    .all();

  const items = db
    .prepare(
      `SELECT oi.*, o.id as order_id
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       ORDER BY oi.id ASC`
    )
    .all() as Array<{
    order_id: number;
    title_ru: string;
    title_uz: string;
    price: number;
    quantity: number;
    total: number;
  }>;


  const itemsByOrder = new Map<number, typeof items>();
  items.forEach((item) => {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  });

  const enriched = (orders as Array<any>).map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return NextResponse.json({ items: enriched });
}
