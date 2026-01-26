import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
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
  const orders = db
    .prepare(
      `SELECT o.id, o.customer_id, o.customer_address_id, o.total_amount, o.status, o.comment,
              o.bonus_used, o.bonus_earned, o.created_at,
              cr.id as courier_id, cr.name as courier_name, cr.phone as courier_phone, cr.car_number as courier_car_number
       FROM orders o
       LEFT JOIN couriers cr ON cr.id = o.courier_id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(customerId) as Array<{
    id: number;
    customer_id: number | null;
    customer_address_id: number | null;
    total_amount: number;
    status: string;
    comment: string | null;
    bonus_used: number;
    bonus_earned: number;
    created_at: string;
    courier_id: number | null;
    courier_name: string | null;
    courier_phone: string | null;
    courier_car_number: string | null;
  }>;

  if (!orders.length) {
    return NextResponse.json({ items: [] });
  }

  const addressIds = Array.from(
    new Set(orders.map((order) => order.customer_address_id).filter(Boolean))
  ) as number[];

  const addressMap = new Map<number, {
    id: number;
    label: string | null;
    address_line: string;
    comment: string | null;
  }>();

  if (addressIds.length) {
    const placeholders = addressIds.map(() => "?").join(", ");
    const rows = db
      .prepare(
        `SELECT id, label, address_line, comment FROM customer_addresses WHERE id IN (${placeholders})`
      )
      .all(...addressIds) as Array<{
      id: number;
      label: string | null;
      address_line: string;
      comment: string | null;
    }>;
    rows.forEach((row) => addressMap.set(row.id, row));
  }

  const orderIds = orders.map((order) => order.id);
  const itemPlaceholders = orderIds.map(() => "?").join(", ");
  const items = db
    .prepare(
      `SELECT order_id, product_id, title_ru, title_uz, price, quantity, total
       FROM order_items
       WHERE order_id IN (${itemPlaceholders})
       ORDER BY id ASC`
    )
    .all(...orderIds) as Array<{
    order_id: number;
    product_id: number | null;
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

  const response = orders.map((order) => ({
    id: order.id,
    customer_id: order.customer_id,
    total_amount: order.total_amount,
    status: order.status,
    comment: order.comment,
    bonus_used: order.bonus_used,
    bonus_earned: order.bonus_earned,
    created_at: order.created_at,
    courier: order.courier_id
      ? {
          id: order.courier_id,
          name: order.courier_name,
          phone: order.courier_phone,
          car_number: order.courier_car_number,
        }
      : null,
    address: order.customer_address_id
      ? addressMap.get(order.customer_address_id) ?? null
      : null,
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return NextResponse.json({ items: response });
}
