"use client";

import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-extrabold text-[var(--ink)]">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm font-medium text-[var(--muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] transition hover:-translate-y-[1px] hover:bg-[#9f5b33] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)] ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[var(--ink)]">{title}</h3>
          <GhostButton onClick={onClose}>Закрыть</GhostButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
