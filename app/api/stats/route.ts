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
  const categories = db
    .prepare("SELECT COUNT(1) as count FROM categories")
    .get() as { count: number };
  const products = db
    .prepare("SELECT COUNT(1) as count FROM products")
    .get() as { count: number };
  const banners = db
    .prepare("SELECT COUNT(1) as count FROM banners")
    .get() as { count: number };
  const topProducts = db
    .prepare("SELECT COUNT(1) as count FROM top_products")
    .get() as { count: number };

  const salesToday = db
    .prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE date(created_at) = date('now')"
    )
    .get() as { total: number };
  const salesWeek = db
    .prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE datetime(created_at) >= datetime('now', '-7 days')"
    )
    .get() as { total: number };
  const salesMonth = db
    .prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE datetime(created_at) >= datetime('now', '-30 days')"
    )
    .get() as { total: number };
  const averageCheck = db
    .prepare(
      "SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders"
    )
    .get() as { avg: number };

  return NextResponse.json({
    categories: categories?.count ?? 0,
    products: products?.count ?? 0,
    banners: banners?.count ?? 0,
    topProducts: topProducts?.count ?? 0,
    salesToday: Math.round(salesToday?.total ?? 0),
    salesWeek: Math.round(salesWeek?.total ?? 0),
    salesMonth: Math.round(salesMonth?.total ?? 0),
    averageCheck: Math.round(averageCheck?.avg ?? 0),
  });
}
