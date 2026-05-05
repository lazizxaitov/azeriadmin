"use client";

import { useEffect, useState } from "react";

import { Card, SectionTitle, PrimaryButton, GhostButton, Modal } from "../_components/ui";

type Settings = {
  cafe_name: string;
  phone: string;
  address: string;
  work_hours: string;
  delivery_fee: number;
  min_order: number;
  currency: string;
  bonus_percent: number;
  bonus_redeem_amount: number;
  card_payment_enabled: number;
  cash_payment_enabled: number;
  card_payment_text: string;
  instagram: string;
  telegram: string;
};

type PickupPoint = {
  id: number;
  title: string;
  address: string;
  phone: string | null;
  work_hours: string | null;
  lat: number | null;
  lng: number | null;
  is_active: number;
};

type PickupPointForm = {
  title: string;
  address: string;
  phone: string;
  work_hours: string;
  lat: string;
  lng: string;
  is_active: boolean;
};

const emptyPointForm: PickupPointForm = {
  title: "",
  address: "",
  phone: "",
  work_hours: "",
  lat: "",
  lng: "",
  is_active: true,
};

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    cafe_name: "",
    phone: "",
    address: "",
    work_hours: "",
    delivery_fee: 0,
    min_order: 0,
    currency: "сум",
    bonus_percent: 0,
    bonus_redeem_amount: 25000,
    card_payment_enabled: 1,
    cash_payment_enabled: 1,
    card_payment_text: "",
    instagram: "",
    telegram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [pointSaving, setPointSaving] = useState(false);
  const [pointForm, setPointForm] = useState<PickupPointForm>(emptyPointForm);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setPointsLoading(true);
    Promise.all([fetch("/api/settings"), fetch("/api/pickup-points")])
      .then(async ([settingsRes, pointsRes]) => {
        const settingsData = await settingsRes.json();
        const pointsData = await pointsRes.json();
        if (settingsData?.item) {
          setForm((prev) => ({ ...prev, ...settingsData.item }));
        }
        if (Array.isArray(pointsData?.items)) {
          setPoints(pointsData.items);
        } else {
          setPoints([]);
        }
      })
      .finally(() => {
        setLoading(false);
        setPointsLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cafeName: form.cafe_name,
        phone: form.phone,
        address: form.address,
        workHours: form.work_hours,
        deliveryFee: Number(form.delivery_fee),
        minOrder: Number(form.min_order),
        currency: form.currency,
        bonusPercent: Number(form.bonus_percent),
        bonusRedeemAmount: Number(form.bonus_redeem_amount),
        cardPaymentEnabled: form.card_payment_enabled === 1,
        cashPaymentEnabled: form.cash_payment_enabled === 1,
        cardPaymentText: form.card_payment_text,
        instagram: form.instagram,
        telegram: form.telegram,
      }),
    });
    setSaving(false);
  };

  const downloadBackup = async () => {
    setDownloading(true);
    const response = await fetch("/api/backup");
    if (!response.ok) {
      setDownloading(false);
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `azeri-backup-${Date.now()}.db`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const downloadFullBackup = async () => {
    setDownloadingFull(true);
    const response = await fetch("/api/backup/full");
    if (!response.ok) {
      setDownloadingFull(false);
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `azeri-full-backup-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setDownloadingFull(false);
  };

  const restoreBackup = async (file: File) => {
    setRestoring(true);
    setRestoreError(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/backup/restore", {
      method: "POST",
      body,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      setRestoreError(error?.error ?? "Ошибка восстановления");
      setRestoring(false);
      return;
    }
    setRestoring(false);
  };

  const openNewPoint = () => {
    setEditingPointId(null);
    setPointForm(emptyPointForm);
    setPointModalOpen(true);
  };

  const openEditPoint = (point: PickupPoint) => {
    setEditingPointId(point.id);
    setPointForm({
      title: point.title,
      address: point.address,
      phone: point.phone ?? "",
      work_hours: point.work_hours ?? "",
      lat: point.lat !== null && point.lat !== undefined ? String(point.lat) : "",
      lng: point.lng !== null && point.lng !== undefined ? String(point.lng) : "",
      is_active: point.is_active === 1,
    });
    setPointModalOpen(true);
  };

  const savePoint = async () => {
    if (!pointForm.title.trim() || !pointForm.address.trim()) return;
    setPointSaving(true);

    const payload = {
      title: pointForm.title.trim(),
      address: pointForm.address.trim(),
      phone: pointForm.phone.trim() || null,
      workHours: pointForm.work_hours.trim() || null,
      lat: pointForm.lat.trim() ? Number(pointForm.lat) : null,
      lng: pointForm.lng.trim() ? Number(pointForm.lng) : null,
      isActive: pointForm.is_active,
    };

    const url = editingPointId
      ? `/api/pickup-points/${editingPointId}`
      : "/api/pickup-points";
    const method = editingPointId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPointSaving(false);
    setPointModalOpen(false);
    load();
  };

  const removePoint = async (id: number) => {
    await fetch(`/api/pickup-points/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Настройки заведения"
        subtitle="Контакты, адрес, время работы и параметры доставки."
      />

      {loading ? (
        <Card>Загрузка...</Card>
      ) : (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Название заведения
              <input
                value={form.cafe_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cafe_name: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Телефон
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                onFocus={() =>
                  setForm((prev) => ({
                    ...prev,
                    phone: prev.phone ? prev.phone : "+998",
                  }))
                }
                placeholder="+998 90 123 45 67"
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Адрес
              <input
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Время работы
              <input
                value={form.work_hours}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, work_hours: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <label className="text-sm font-semibold">
              Доставка (сум)
              <input
                type="number"
                value={form.delivery_fee}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    delivery_fee: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Минимальный заказ
              <input
                type="number"
                value={form.min_order}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    min_order: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Валюта
              <input
                value={form.currency}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currency: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Бонус процент (%)
              <input
                type="number"
                value={form.bonus_percent}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    bonus_percent: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Бонусы при оплате
              <input
                type="number"
                value={form.bonus_redeem_amount}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    bonus_redeem_amount: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Instagram
              <input
                value={form.instagram}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, instagram: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold">
              Telegram
              <input
                value={form.telegram}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, telegram: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--stroke)] bg-white p-4">
            <p className="text-sm font-extrabold text-[var(--ink)]">Оплата</p>
            <p className="mt-1 text-xs font-medium text-[var(--muted)]">
              Эти настройки передаются в мобильное приложение.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold">
                <span>Оплата картой</span>
                <input
                  type="checkbox"
                  checked={form.card_payment_enabled === 1}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      card_payment_enabled: event.target.checked ? 1 : 0,
                    }))
                  }
                  className="h-5 w-5 accent-[var(--brand)]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold">
                <span>Оплата наличными</span>
                <input
                  type="checkbox"
                  checked={form.cash_payment_enabled === 1}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cash_payment_enabled: event.target.checked ? 1 : 0,
                    }))
                  }
                  className="h-5 w-5 accent-[var(--brand)]"
                />
              </label>
            </div>

            {form.card_payment_enabled === 0 ? (
              <label className="mt-4 block text-sm font-semibold">
                Текст для оплаты картой (номер карты)
                <textarea
                  value={form.card_payment_text}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      card_payment_text: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Например: 8600 1234 5678 9012 (HUMO) — Имя Фамилия"
                  className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                />
                <span className="mt-2 block text-xs font-medium text-[var(--muted)]">
                  Показывается в мобильном приложении, когда оплата картой выключена.
                </span>
              </label>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Сохраняю..." : "Сохранить"}
            </PrimaryButton>
            <GhostButton onClick={load}>Обновить</GhostButton>
            <GhostButton onClick={downloadBackup} disabled={downloading}>
              {downloading ? "Готовлю бэкап..." : "Скачать бэкап"}
            </GhostButton>
            <GhostButton onClick={downloadFullBackup} disabled={downloadingFull}>
              {downloadingFull ? "Готовлю полный бэкап..." : "Скачать полный бэкап"}
            </GhostButton>
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]">
              {restoring ? "Восстанавливаю..." : "Восстановить бэкап"}
              <input
                type="file"
                accept=".zip,.db"
                disabled={restoring}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  restoreBackup(file);
                  event.currentTarget.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
          {restoreError ? (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {restoreError}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--muted)]">
            После восстановления перезапустите приложение, чтобы новые данные
            загрузились.
          </p>
        </Card>
      )}

      <SectionTitle
        title="Точки самовывоза"
        subtitle="Список адресов, которые показываются в мобильном приложении."
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--muted)]">
            Добавьте все точки самовывоза и отметьте активные.
          </p>
          <PrimaryButton onClick={openNewPoint}>Добавить точку</PrimaryButton>
        </div>

        {pointsLoading ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Загрузка...</p>
        ) : points.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Точек пока нет.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {points.map((point) => (
              <div
                key={point.id}
                className="rounded-3xl border border-[var(--stroke)] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-[var(--ink)]">
                      {point.title}
                    </p>
                    <p className="text-sm text-[var(--muted)]">{point.address}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      point.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {point.is_active ? "Активна" : "Выключена"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">
                  {point.phone ? <p>Телефон: {point.phone}</p> : null}
                  {point.work_hours ? <p>Время: {point.work_hours}</p> : null}
                  {point.lat !== null && point.lng !== null ? (
                    <p>
                      Координаты: {point.lat}, {point.lng}
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <GhostButton onClick={() => openEditPoint(point)}>
                    Редактировать
                  </GhostButton>
                  <GhostButton onClick={() => removePoint(point.id)}>
                    Удалить
                  </GhostButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={pointModalOpen}
        onClose={() => setPointModalOpen(false)}
        title={editingPointId ? "Редактировать точку" : "Новая точка"}
        footer={
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={savePoint} disabled={pointSaving}>
              {pointSaving ? "Сохраняю..." : "Сохранить"}
            </PrimaryButton>
            <GhostButton onClick={() => setPointModalOpen(false)}>
              Отмена
            </GhostButton>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Название
            <input
              value={pointForm.title}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Телефон
            <input
              value={pointForm.phone}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              onFocus={() =>
                setPointForm((prev) => ({
                  ...prev,
                  phone: prev.phone ? prev.phone : "+998",
                }))
              }
              placeholder="+998 90 123 45 67"
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
        <div className="mt-4">
          <label className="text-sm font-semibold">
            Адрес
            <input
              value={pointForm.address}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, address: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Время работы
            <input
              value={pointForm.work_hours}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, work_hours: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Активна
            <select
              value={pointForm.is_active ? "1" : "0"}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, is_active: event.target.value === "1" }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            >
              <option value="1">Да</option>
              <option value="0">Нет</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Широта (lat)
            <input
              value={pointForm.lat}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, lat: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Долгота (lng)
            <input
              value={pointForm.lng}
              onChange={(event) =>
                setPointForm((prev) => ({ ...prev, lng: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
