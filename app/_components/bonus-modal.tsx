"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  bonus_balance: number;
  birth_date: string | null;
};

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default function BonusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [bonusPercent, setBonusPercent] = useState(0);

  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [redeemAmount, setRedeemAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    birthDate: "",
  });

  const debounceRef = useRef<number | null>(null);

  const purchaseBonusPreview = useMemo(() => {
    const amount = Number(purchaseAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    return Math.floor((amount * Math.max(0, bonusPercent)) / 100);
  }, [purchaseAmount, bonusPercent]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    fetch("/api/bonus-config")
      .then((res) => res.json())
      .then((data) => setBonusPercent(Number(data?.bonusPercent ?? 0)))
      .catch(() => setBonusPercent(0));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = normalizePhoneInput(phoneQuery.trim());
    if (!q) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetch(`/api/customer-search?phone=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => setResults(Array.isArray(data?.items) ? data.items : []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [open, phoneQuery]);

  const closeAll = () => {
    setPhoneQuery("");
    setResults([]);
    setSelected(null);
    setPurchaseAmount("");
    setAdjustAmount("");
    setRedeemAmount("");
    setAdjustMode("add");
    setError(null);
    setCreateOpen(false);
    setCreateForm({ name: "", phone: "", birthDate: "" });
    onClose();
  };

  const refreshSelected = async (customerId: number) => {
    const q = selected?.phone ?? phoneQuery;
    if (!q) return;
    const response = await fetch(`/api/customer-search?phone=${encodeURIComponent(q)}`);
    const data = await response.json();
    const items: Customer[] = Array.isArray(data?.items) ? data.items : [];
    const found = items.find((it) => it.id === customerId) ?? null;
    if (found) setSelected(found);
  };

  const applyBonus = async (payload: any) => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selected.id, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Ошибка операции");
        setSaving(false);
        return;
      }
      setSelected((prev) =>
        prev ? { ...prev, bonus_balance: Number(data?.balance ?? prev.bonus_balance) } : prev
      );
      setPurchaseAmount("");
      setAdjustAmount("");
      setRedeemAmount("");
    } catch {
      setError("Ошибка операции");
    } finally {
      setSaving(false);
      refreshSelected(selected.id).catch(() => null);
    }
  };

  const createCustomer = async () => {
    const name = createForm.name.trim();
    const phone = createForm.phone.trim();
    const birthDate = createForm.birthDate.trim();
    if (!name || !phone) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/customer-quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          birthDate: birthDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Не удалось создать клиента");
        setSaving(false);
        return;
      }
      const item = data?.item as Customer | undefined;
      if (item?.id) {
        setSelected(item);
        setPhoneQuery(item.phone ?? phone);
        setResults([]);
      }
      setCreateOpen(false);
      setCreateForm({ name: "", phone: "", birthDate: "" });
    } catch {
      setError("Не удалось создать клиента");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAll} />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[var(--ink)]">Бонусы</h3>
            <p className="text-xs font-medium text-[var(--muted)]">
              Найдите клиента по телефону и начислите/спишите бонусы.
            </p>
          </div>
          <button
            onClick={closeAll}
            className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
          >
            Закрыть
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[var(--stroke)] bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1 text-sm font-semibold">
                Телефон
                <input
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  placeholder="+998..."
                  className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(true);
                  setCreateForm((prev) => ({
                    ...prev,
                    phone: prev.phone || phoneQuery,
                  }));
                }}
                className="h-[46px] rounded-2xl border border-[var(--stroke)] bg-white px-4 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
              >
                + Клиент
              </button>
            </div>

            {searching ? (
              <p className="mt-3 text-xs font-medium text-[var(--muted)]">Поиск…</p>
            ) : null}

            {!selected && results.length ? (
              <div className="mt-3 grid gap-2">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setResults([]);
                    }}
                    className="flex items-center justify-between rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
                  >
                    <span className="font-semibold text-[var(--ink)]">
                      {item.name} · {item.phone ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-[var(--muted)]">
                      Бонусы: {Number(item.bonus_balance ?? 0).toLocaleString("ru-RU")}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {selected ? (
              <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--ink)]">
                      {selected.name}
                    </p>
                    <p className="text-xs font-medium text-[var(--muted)]">
                      {selected.phone ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Баланс
                    </p>
                    <p className="text-lg font-extrabold text-[var(--ink)]">
                      {Number(selected.bonus_balance ?? 0).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[var(--stroke)] bg-white p-4">
                <p className="text-sm font-extrabold text-[var(--ink)]">
                  Начислить от покупки
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                  Процент из настроек: {bonusPercent}%
                </p>
                <label className="mt-3 block text-sm font-semibold">
                  Сумма покупки
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                  Будет начислено: {purchaseBonusPreview.toLocaleString("ru-RU")}
                </p>
                <button
                  disabled={saving || !purchaseAmount || Number(purchaseAmount) <= 0}
                  onClick={() =>
                    applyBonus({ op: "earn", purchaseAmount: Number(purchaseAmount) })
                  }
                  className="mt-4 w-full rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Сохраняю..." : "Начислить бонус"}
                </button>
              </div>

              <div className="rounded-3xl border border-[var(--stroke)] bg-white p-4">
                <p className="text-sm font-extrabold text-[var(--ink)]">
                  Ручные операции
                </p>

                <div className="mt-3 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Режим
                      <select
                        value={adjustMode}
                        onChange={(e) => setAdjustMode(e.target.value as any)}
                        className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                      >
                        <option value="add">Добавить</option>
                        <option value="remove">Убрать</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold">
                      Кол-во бонусов
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    disabled={saving || !adjustAmount || Number(adjustAmount) <= 0}
                    onClick={() => {
                      const amount = Math.trunc(Number(adjustAmount));
                      const delta = adjustMode === "remove" ? -amount : amount;
                      applyBonus({ op: "adjust", bonusDelta: delta });
                    }}
                    className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Сохраняю..." : "Применить"}
                  </button>

                  <div className="mt-1 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Использовать бонус
                      <input
                        type="number"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                      />
                    </label>
                    <button
                      disabled={saving || !redeemAmount || Number(redeemAmount) <= 0}
                      onClick={() =>
                        applyBonus({ op: "redeem", redeemAmount: Number(redeemAmount) })
                      }
                      className="mt-7 w-full rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Сохраняю..." : "Использовать"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : null}
        </div>

        {createOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setCreateOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-extrabold text-[var(--ink)]">
                  Новый клиент
                </h4>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
                >
                  Закрыть
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="text-sm font-semibold">
                  Имя
                  <input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Телефон
                  <input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Дата рождения
                  <input
                    type="text"
                    value={createForm.birthDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                    inputMode="numeric"
                    placeholder="ДД.ММ.ГГГГ (например 31.12.1999)"
                    className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <button
                  disabled={saving || !createForm.name.trim() || !createForm.phone.trim()}
                  onClick={createCustomer}
                  className="mt-2 w-full rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Создаю..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
