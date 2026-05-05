"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BonusModal from "../_components/bonus-modal";

type Courier = {
  id: number;
  name: string;
  phone?: string | null;
  car_number?: string | null;
};

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
  comment?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  address_line?: string | null;
  address_comment?: string | null;
  address_label?: string | null;
  courier_id?: number | null;
  payment_method?: string | null;
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  paid: "Новый",
  accepted: "Принят",
  in_delivery: "В доставке",
  completed: "Доставлен",
  canceled: "Не принят",
};

export default function CashierPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notifications, setNotifications] = useState<Order[]>([]);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);
  const lastSnapshotRef = useRef<string>("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);

  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // ignore audio errors
    }
  };

  const load = () => {
    setLoading(true);
    Promise.all([fetch("/api/cashier/orders"), fetch("/api/couriers")])
      .then(async ([ordersRes, couriersRes]) => {
        const ordersData = await ordersRes.json();
        const couriersData = await couriersRes.json();
        const incoming = ordersData.items ?? [];
        const snapshot = JSON.stringify(
          incoming.map((order: Order) => [order.id, order.status, order.courier_id])
        );
        const hasChanges = snapshot !== lastSnapshotRef.current;

        if (hasChanges) {
          setOrders(incoming);
          lastSnapshotRef.current = snapshot;
        }

        if (Array.isArray(couriersData.items)) {
          setCouriers(couriersData.items ?? []);
        }

        if (!initializedRef.current) {
          incoming.forEach((order: Order) => seenIdsRef.current.add(order.id));
          initializedRef.current = true;
          return;
        }

        const fresh = incoming.filter(
          (order: Order) => !seenIdsRef.current.has(order.id)
        );
        if (fresh.length > 0) {
          fresh.forEach((order: Order) => seenIdsRef.current.add(order.id));
          setNewOrder(fresh[0]);
          setNewOrderOpen(true);
          setUnreadCount((prev) => prev + fresh.length);
          setNotifications((prev) => [...fresh, ...prev].slice(0, 20));
          playNotificationSound();
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, []);

  const assignCourier = async (orderId: number, courierId: number | null) => {
    await fetch(`/api/cashier/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courierId }),
    });
    load();
  };

  const setOrderStatus = async (orderId: number, status: string) => {
    await fetch(`/api/cashier/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    await fetch(`/api/cashier/orders/${rejecting.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled", cancelReason: rejectReason }),
    });
    setRejecting(null);
    setRejectReason("");
    load();
  };

  const logout = async () => {
    await fetch("/api/auth/cashier-logout", { method: "POST" });
    router.push("/login");
  };

  const openNotifications = () => {
    setHistoryOpen(true);
    setUnreadCount(0);
  };

  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "canceled"
  );

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
                Новые заказы из мобильного приложения.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--stroke)] bg-white text-lg shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
              aria-label="Уведомления"
            >
              🔔
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <div className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] shadow-sm">
              {now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <Link
              href="/cashier/products"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Товары
            </Link>
            <button
              onClick={() => setBonusOpen(true)}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Добавить бонус
            </button>
            <Link
              href="/cashier/history"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              История заказов
            </Link>
            <button
              onClick={logout}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Выйти
            </button>
          </div>
        </header>

        <BonusModal open={bonusOpen} onClose={() => setBonusOpen(false)} />

        {loading ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Загрузка...
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Пока нет заказов.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeOrders.map((order) => (
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
                  <p className="text-[var(--muted)]">
                    Способ оплаты: {order.payment_method ?? "—"}
                  </p>
                  {order.address_comment ? (
                    <p className="text-[var(--muted)]">
                      Комментарий: {order.address_comment}
                    </p>
                  ) : null}
                  {order.comment ? (
                    <p className="text-[var(--muted)]">
                      Комментарий к заказу: {order.comment}
                    </p>
                  ) : null}
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

                <div className="mt-4">
                  <label className="text-sm font-semibold">
                    Доставщик
                    <select
                      value={order.courier_id ?? ""}
                      onChange={(event) =>
                        assignCourier(
                          order.id,
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Не назначен</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}
                          {courier.phone ? ` · ${courier.phone}` : ""}
                          {courier.car_number ? ` · ${courier.car_number}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === "paid" ? (
                    <>
                      <button
                        onClick={() => setOrderStatus(order.id, "accepted")}
                        className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33]"
                      >
                        Принять заказ
                      </button>
                      <button
                        onClick={() => {
                          setRejecting(order);
                          setRejectReason("");
                        }}
                        className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
                      >
                        Не принять
                      </button>
                    </>
                  ) : null}
                  {order.status === "accepted" ? (
                    <button
                      onClick={() => setOrderStatus(order.id, "in_delivery")}
                      disabled={!order.courier_id}
                      className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Доставляется
                    </button>
                  ) : null}
                  {order.status === "in_delivery" ? (
                    <button
                      onClick={() => setOrderStatus(order.id, "completed")}
                      className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
                    >
                      Доставлен
                    </button>
                  ) : null}
                </div>
                {order.status === "accepted" && !order.courier_id ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Выберите доставщика, чтобы начать доставку.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {newOrderOpen && newOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setNewOrderOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[var(--ink)]">
                Новый заказ #{newOrder.id}
              </h3>
              <button
                onClick={() => setNewOrderOpen(false)}
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
                  {newOrder.customer_name ?? "Гость"}
                </p>
                <p className="text-[var(--muted)]">
                  {newOrder.customer_phone ?? "Телефон не указан"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Адрес доставки
                </p>
                <p className="mt-2 text-[var(--ink)]">
                  {newOrder.address_label ? `${newOrder.address_label} · ` : ""}
                  {newOrder.address_line ?? "—"}
                </p>
                {newOrder.address_comment ? (
                  <p className="text-[var(--muted)]">
                    Комментарий: {newOrder.address_comment}
                  </p>
                ) : null}
              </div>
            </div>

            {newOrder.comment ? (
              <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Комментарий к заказу
                </p>
                <p className="mt-2 text-[var(--ink)]">{newOrder.comment}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Состав заказа
              </p>
              <div className="mt-3 space-y-2">
                {newOrder.items.map((item, index) => (
                  <div
                    key={`${newOrder.id}-${index}`}
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
                  {newOrder.total_amount.toLocaleString("ru-RU")} сум
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="absolute left-0 right-0 top-0 mx-auto w-full max-w-3xl px-6">
            <div className="mt-4 rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] transition-all duration-300 ease-out animate-[slideDown_0.28s_ease-out]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[var(--ink)]">
                  Уведомления
                </h3>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] shadow-sm"
                >
                  Закрыть
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-[var(--stroke)] bg-white p-4 text-sm text-[var(--muted)]">
                  Пока нет уведомлений.
                </div>
              ) : (
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                  {notifications.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          Заказ #{order.id} · {order.total_amount.toLocaleString("ru-RU")} сум
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {order.customer_name ?? "Гость"} · {order.customer_phone ?? "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewOrder(order);
                          setNewOrderOpen(true);
                          setHistoryOpen(false);
                        }}
                        className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] shadow-sm"
                      >
                        Открыть
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setRejecting(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[var(--ink)]">
                Причина отмены заказа #{rejecting.id}
              </h3>
              <button
                onClick={() => setRejecting(null)}
                className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] shadow-sm"
              >
                Закрыть
              </button>
            </div>
            <label className="text-sm font-semibold">
              Причина
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={confirmReject}
                className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33]"
              >
                Подтвердить
              </button>
              <button
                onClick={() => setRejecting(null)}
                className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
