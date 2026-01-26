"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderItem = {
  title_ru: string;
  title_uz: string;
  price: number;
  quantity: number;
  total: number;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  address_line?: string | null;
  address_label?: string | null;
  created_at?: string | null;
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  paid: "Новый",
  accepted: "Принят",
  in_delivery: "В доставке",
  completed: "Доставлен",
  canceled: "Отменён",
};

export default function CashierHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("completed");

  const load = () => {
    setLoading(true);
    fetch("/api/cashier/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const statusOk = statusFilter === "all" || order.status === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      const target = `${order.id} ${order.customer_name ?? ""} ${order.customer_phone ?? ""}`
        .toLowerCase()
        .trim();
      return target.includes(q);
    });
  }, [orders, query, statusFilter]);

  const logout = async () => {
    await fetch("/api/auth/cashier-logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen grainy px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Логотип" width={64} height={64} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Azeri Cafe
              </p>
              <p className="text-sm text-[var(--muted)]">
                История заказов кассы.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cashier"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Заказы
            </Link>
            <Link
              href="/cashier/products"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Товары
            </Link>
            <button
              onClick={logout}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Выйти
            </button>
          </div>
        </header>

        <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск: № заказа, имя, телефон"
              className="h-10 w-full max-w-sm rounded-2xl border border-[var(--stroke)] bg-white px-3 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-2xl border border-[var(--stroke)] bg-white px-3 text-sm"
            >
              <option value="completed">Доставлен</option>
              <option value="canceled">Отменён</option>
              <option value="all">Все</option>
            </select>
            <button
              onClick={load}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Обновить
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            История пока пустая.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Заказ #{order.id}
                    </p>
                    <p className="text-lg font-extrabold text-[var(--ink)]">
                      {order.total_amount.toLocaleString("ru-RU")} сум
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Статус: {statusLabels[order.status] ?? order.status}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--muted)]">
                    {order.customer_name ?? "Гость"}
                    <br />
                    {order.customer_phone ?? ""}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm">
                  <p className="font-semibold text-[var(--ink)]">Адрес доставки</p>
                  <p className="text-[var(--muted)]">
                    {order.address_label ? `${order.address_label} · ` : ""}
                    {order.address_line ?? "—"}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold text-[var(--ink)]">
                        {item.title_ru}
                      </span>
                      <span className="text-[var(--muted)]">
                        {item.quantity} × {item.price.toLocaleString("ru-RU")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}