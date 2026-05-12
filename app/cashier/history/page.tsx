"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BonusModal from "../../_components/bonus-modal";

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
  payment_method?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  in_delivery_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_car_number?: string | null;
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  paid: "Новый",
  accepted: "Принят",
  in_delivery: "Доставляется",
  completed: "Доставлен",
  canceled: "Не принят",
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CashierHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("completed");
  const [selected, setSelected] = useState<Order | null>(null);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      const phoneDigits = normalizePhone(order.customer_phone ?? "");
      const qDigits = normalizePhone(q);
      const target = `${order.id} ${order.customer_name ?? ""} ${order.customer_phone ?? ""}`
        .toLowerCase()
        .trim();
      if (qDigits) {
        return phoneDigits.includes(qDigits) || target.includes(q);
      }
      return target.includes(q);
    });
  }, [orders, query, statusFilter]);

  const logout = async () => {
    await fetch("/api/auth/cashier-logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen grainy px-4 py-6 sm:px-6 sm:py-8">
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
              <p className="text-sm text-[var(--muted)]">История заказов кассы.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBonusOpen(true)}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)] sm:px-4 sm:text-sm"
            >
              Бонусы клиентов
            </button>
            <div className="hidden items-center gap-3 sm:flex">
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
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--stroke)] bg-white text-lg font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)] sm:hidden"
              aria-label="Меню"
            >
              ☰
            </button>
          </div>
        </header>

        <BonusModal open={bonusOpen} onClose={() => setBonusOpen(false)} />
        {menuOpen ? (
          <div className="fixed inset-0 z-50 flex items-start justify-end px-4 py-6 sm:hidden">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xs rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-[var(--ink)]">Меню</p>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-bold text-[var(--ink)] shadow-sm"
                >
                  Закрыть
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <Link
                  href="/cashier"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-sm"
                >
                  Заказы
                </Link>
                <Link
                  href="/cashier/products"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-sm"
                >
                  Товары
                </Link>
                <button
                  onClick={logout}
                  className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-sm"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
              <option value="canceled">Не принят</option>
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
          <div className="space-y-3">
            {filtered.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelected(order)}
                className="flex w-full items-center justify-between rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4 text-left shadow-[var(--shadow)] transition hover:-translate-y-[1px]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Заказ #{order.id}
                  </p>
                  <p className="text-lg font-extrabold text-[var(--ink)]">
                    {order.total_amount.toLocaleString("ru-RU")} сум
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {order.customer_name ?? "Гость"} · {order.customer_phone ?? ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {statusLabels[order.status] ?? order.status}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {formatTime(order.completed_at || order.canceled_at || order.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[var(--ink)]">
                Заказ #{selected.id}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] shadow-sm"
              >
                Закрыть
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Клиент
                </p>
                <p className="mt-2 text-base font-bold text-[var(--ink)]">
                  {selected.customer_name ?? "Гость"}
                </p>
                <p className="text-[var(--muted)]">
                  {selected.customer_phone ?? "Телефон не указан"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Доставщик
                </p>
                <p className="mt-2 text-base font-bold text-[var(--ink)]">
                  {selected.courier_name ?? "Не назначен"}
                </p>
                <p className="text-[var(--muted)]">
                  {selected.courier_phone ?? ""}
                  {selected.courier_car_number ? ` · ${selected.courier_car_number}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
              <p className="font-semibold text-[var(--ink)]">Адрес доставки</p>
              <p className="text-[var(--muted)]">
                {selected.address_label ? `${selected.address_label} · ` : ""}
                {selected.address_line ?? "—"}
              </p>
              <p className="text-[var(--muted)]">
                Способ оплаты: {selected.payment_method ?? "—"}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Таймлайн заказа
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--muted)]">Принят</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {formatTime(selected.accepted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Доставляется</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {formatTime(selected.in_delivery_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Доставлен</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {formatTime(selected.completed_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Не принят</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {formatTime(selected.canceled_at)}
                  </p>
                </div>
              </div>
            </div>

            {selected.status === "canceled" ? (
              <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Причина отмены
                </p>
                <p className="mt-2 text-[var(--ink)]">
                  {selected.cancel_reason || "—"}
                </p>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Состав заказа
              </p>
              <div className="mt-3 space-y-2">
                {selected.items.map((item, index) => (
                  <div
                    key={`${selected.id}-${index}`}
                    className="flex items-center justify-between"
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
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Итого</span>
                <span className="text-lg font-extrabold text-[var(--ink)]">
                  {selected.total_amount.toLocaleString("ru-RU")} сум
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
