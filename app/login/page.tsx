"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierUser, setCashierUser] = useState("");
  const [cashierPass, setCashierPass] = useState("");
  const [cashierError, setCashierError] = useState<string | null>(null);
  const [cashierLoading, setCashierLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Неверный логин или пароль.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  const submitCashier = async (event: React.FormEvent) => {
    event.preventDefault();
    setCashierLoading(true);
    setCashierError(null);
    const response = await fetch("/api/auth/cashier-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cashierUser, password: cashierPass }),
    });

    if (!response.ok) {
      setCashierError("Неверный логин или пароль.");
      setCashierLoading(false);
      return;
    }

    router.push("/cashier");
  };

  return (
    <div className="min-h-screen grainy px-6 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto -mb-7 flex h-44 w-44 items-center justify-center">
            <Image src="/logo.png" alt="Логотип" width={176} height={176} />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Вход в админ-панель кондитерской
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
        >
          <label className="mb-4 block text-sm font-semibold text-[var(--ink)]">
            Логин
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-base font-medium text-[var(--ink)] shadow-sm focus:border-[var(--brand)] focus:outline-none"
              placeholder="Введите логин"
            />
          </label>
          <label className="mb-5 block text-sm font-semibold text-[var(--ink)]">
            Пароль
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-base font-medium text-[var(--ink)] shadow-sm focus:border-[var(--brand)] focus:outline-none"
              placeholder="Введите пароль"
            />
          </label>

          {error ? (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-base font-bold text-white shadow-[var(--shadow)] transition hover:translate-y-[-1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCashierOpen(true);
              setCashierError(null);
            }}
            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-[var(--stroke)] bg-white px-5 py-3 text-base font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
          >
            Войти в Кассу Azeri
          </button>
        </form>
      </div>

      {cashierOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setCashierOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[var(--ink)]">
                Вход в кассу
              </h3>
              <button
                onClick={() => setCashierOpen(false)}
                className="rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] shadow-sm"
              >
                Закрыть
              </button>
            </div>
            <form onSubmit={submitCashier} className="space-y-4">
              <label className="text-sm font-semibold">
                Логин
                <input
                  value={cashierUser}
                  onChange={(event) => setCashierUser(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="text-sm font-semibold">
                Пароль
                <input
                  type="password"
                  value={cashierPass}
                  onChange={(event) => setCashierPass(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
                />
              </label>
              {cashierError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  {cashierError}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={cashierLoading}
                className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-base font-bold text-white shadow-[var(--shadow)] transition hover:translate-y-[-1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cashierLoading ? "Входим..." : "Войти"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
