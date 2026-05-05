"use client";

import { useEffect, useState } from "react";

import { Card, SectionTitle, PrimaryButton, GhostButton, Modal } from "../_components/ui";

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  orders_count: number;
  total_spent: number;
};

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    birthDate: "",
    password: "",
  });
  const [addressForm, setAddressForm] = useState({
    label: "",
    addressLine: "",
    comment: "",
    isDefault: false,
  });
  const [searchPhone, setSearchPhone] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  };

  const openDetails = async (id: number) => {
    setSelectedId(id);
    setDetailsLoading(true);
    setDetails(null);
    setShowPassword(false);
    const response = await fetch(`/api/customers/${id}`);
    const data = await response.json();
    setDetails(data);
    setDetailsLoading(false);
  };

  const addCustomer = async () => {
    const payload = {
      name: addForm.name,
      phone: addForm.phone,
      birthDate: addForm.birthDate || null,
      password: addForm.password,
    };
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setAddForm({ name: "", phone: "", birthDate: "", password: "" });
    setAddOpen(false);
    load();
  };

  const addAddress = async () => {
    if (!selectedId) return;
    const payload = {
      label: addressForm.label || null,
      addressLine: addressForm.addressLine,
      comment: addressForm.comment || null,
      isDefault: addressForm.isDefault,
    };
    await fetch(`/api/customers/${selectedId}/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setAddressForm({ label: "", addressLine: "", comment: "", isDefault: false });
    openDetails(selectedId);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ink)]">Клиенты</h2>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            Список клиентов и история заказов.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
            placeholder="Поиск по телефону"
            className="h-9 w-52 rounded-2xl border border-[var(--stroke)] bg-white px-3 text-xs"
          />
          <GhostButton onClick={() => setSearchPhone("")}>Поиск</GhostButton>
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">База клиентов</h3>
          <p className="text-sm text-[var(--muted)]">
            Телефоны, пароли, адреса доставки и суммы заказов.
          </p>
        </div>
        <PrimaryButton onClick={() => setAddOpen(true)}>
          Добавить клиента
        </PrimaryButton>
      </Card>


      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>Загрузка...</Card>
        ) : items.length === 0 ? (
          <Card>Пока нет клиентов.</Card>
        ) : (
          items
            .filter((item) => {
              const query = searchPhone.trim().toLowerCase();
              if (!query) return true;
              const phone = (item.phone ?? "").toLowerCase();
              return phone.includes(query);
            })
            .map((item) => (
            <Card
              key={item.id}
              className="flex cursor-pointer items-center justify-between transition hover:-translate-y-[1px]"
              onClick={() => openDetails(item.id)}
            >
              <div>
                <p className="text-lg font-bold text-[var(--ink)]">
                  {item.name}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {item.phone ?? "Телефон не указан"}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Заказов: {item.orders_count}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Потрачено
                </p>
                <p className="text-lg font-extrabold text-[var(--ink)]">
                  {item.total_spent.toLocaleString("ru-RU")} сум
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={selectedId !== null}
        onClose={() => {
          setSelectedId(null);
          setDetails(null);
          setShowPassword(false);
        }}
        title="Карточка клиента"
      >
        {detailsLoading ? (
          <Card>Загрузка...</Card>
        ) : details ? (
          <div className="space-y-5">
            <Card className="space-y-2">
              <p className="text-lg font-extrabold text-[var(--ink)]">
                {details.customer?.name}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Телефон: {details.customer?.phone ?? "—"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Дата рождения: {details.customer?.birth_date ?? "—"}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  Пароль: {showPassword ? details.customer?.password ?? "—" : "••••••••"}
                </p>
                <GhostButton onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? "Скрыть" : "Показать"}
                </GhostButton>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Заказов
                  </p>
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {details.stats?.orders_count ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Потрачено
                  </p>
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {details.stats?.total_spent?.toLocaleString("ru-RU") ?? 0} сум
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[var(--ink)]">
                  Адреса доставки
                </h4>
              </div>
              {details.addresses?.length ? (
                <div className="space-y-3">
                  {details.addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {addr.label ?? "Адрес"}
                        {addr.is_default ? " · основной" : ""}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {addr.address_line}
                      </p>
                      {addr.comment ? (
                        <p className="text-xs text-[var(--muted)]">
                          {addr.comment}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Пока нет адресов.
                </p>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Название (например, Дом)"
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      label: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                />
                <input
                  placeholder="Адрес доставки"
                  value={addressForm.addressLine}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      addressLine: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                />
                <input
                  placeholder="Комментарий"
                  value={addressForm.comment}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      comment: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm md:col-span-2"
                />
                <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(event) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        isDefault: event.target.checked,
                      }))
                    }
                  />
                  Сделать основным
                </label>
              </div>
              <PrimaryButton onClick={addAddress}>Добавить адрес</PrimaryButton>
            </Card>
          </div>
        ) : (
          <Card>Нет данных.</Card>
        )}
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Новый клиент"
      >
        <div className="space-y-4">
          <label className="text-sm font-semibold">
            Имя
            <input
              value={addForm.name}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Телефон (+998)
            <input
              value={addForm.phone}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Дата рождения
            <input
              type="text"
              value={addForm.birthDate}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, birthDate: event.target.value }))
              }
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Пароль
            <input
              value={addForm.password}
              onChange={(event) =>
                setAddForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={addCustomer}>Создать</PrimaryButton>
            <GhostButton onClick={() => setAddOpen(false)}>Отмена</GhostButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
