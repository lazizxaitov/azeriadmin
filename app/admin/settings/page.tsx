"use client";

import { useEffect, useState } from "react";

import { Card, SectionTitle, PrimaryButton, GhostButton } from "../_components/ui";

type Settings = {
  cafe_name: string;
  phone: string;
  address: string;
  work_hours: string;
  delivery_fee: number;
  min_order: number;
  currency: string;
  instagram: string;
  telegram: string;
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
    instagram: "",
    telegram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.item) {
          setForm(data.item);
        }
      })
      .finally(() => setLoading(false));
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

          <div className="mt-4 grid gap-4 md:grid-cols-3">
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

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Сохраняю..." : "Сохранить"}
            </PrimaryButton>
            <GhostButton onClick={load}>Обновить</GhostButton>
            <GhostButton onClick={downloadBackup} disabled={downloading}>
              {downloading ? "Готовлю бэкап..." : "Скачать бэкап"}
            </GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}
