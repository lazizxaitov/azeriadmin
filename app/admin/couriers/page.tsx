"use client";

import { useEffect, useState } from "react";

import { Card, SectionTitle, PrimaryButton, GhostButton, Modal } from "../_components/ui";

type Courier = {
  id: number;
  name: string;
  phone?: string | null;
  car_number?: string | null;
  comment?: string | null;
  is_active: number;
};

type CourierForm = {
  name: string;
  phone: string;
  carNumber: string;
  comment: string;
  isActive: boolean;
};

const emptyForm: CourierForm = {
  name: "",
  phone: "",
  carNumber: "",
  comment: "",
  isActive: true,
};

export default function CouriersPage() {
  const [items, setItems] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourierForm>(emptyForm);

  const load = () => {
    setLoading(true);
    fetch("/api/couriers")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: Courier) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      phone: item.phone ?? "",
      carNumber: item.car_number ?? "",
      comment: item.comment ?? "",
      isActive: item.is_active === 1,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      carNumber: form.carNumber.trim() || null,
      comment: form.comment.trim() || null,
      isActive: form.isActive,
    };

    if (editingId) {
      await fetch(`/api/couriers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/couriers/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Доставщики"
        subtitle="Добавляйте курьеров, чтобы касса могла выбрать их для заказа."
      />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Список доставщиков</h3>
          <p className="text-sm text-[var(--muted)]">
            Телефон, машина и комментарии сохраняются для каждого курьера.
          </p>
        </div>
        <PrimaryButton onClick={openNew}>Добавить доставщика</PrimaryButton>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>Загрузка...</Card>
        ) : items.length === 0 ? (
          <Card>Пока нет доставщиков.</Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[var(--ink)]">{item.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.phone ? `Телефон: ${item.phone}` : "Телефон не указан"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.car_number ? `Машина: ${item.car_number}` : "Машина не указана"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.is_active ? "Активен" : "Выключен"}
                </span>
              </div>
              {item.comment ? (
                <div className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs text-[var(--muted)]">
                  {item.comment}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={() => openEdit(item)}>Редактировать</GhostButton>
                <GhostButton onClick={() => remove(item.id)}>Удалить</GhostButton>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Редактировать доставщика" : "Новый доставщик"}
        footer={
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Сохраняю..." : "Сохранить"}
            </PrimaryButton>
            <GhostButton onClick={() => setModalOpen(false)}>Отмена</GhostButton>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Имя и фамилия
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
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
            Номер машины
            <input
              value={form.carNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, carNumber: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Статус
            <select
              value={form.isActive ? "1" : "0"}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.value === "1" }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            >
              <option value="1">Активен</option>
              <option value="0">Выключен</option>
            </select>
          </label>
        </div>
        <div className="mt-4">
          <label className="text-sm font-semibold">
            Комментарий
            <textarea
              value={form.comment}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, comment: event.target.value }))
              }
              rows={3}
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}