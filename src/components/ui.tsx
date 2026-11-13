import React from "react";

/**
 * Primitivas de interface acessíveis: botões grandes, labels explícitas,
 * mensagens de erro ligadas via aria-describedby, estados de carregamento.
 */

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  const base =
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const variants: Record<string, string> = {
    primary: "bg-brand-700 text-white hover:bg-brand-800",
    secondary: "border-2 border-brand-700 bg-white text-brand-800 hover:bg-brand-50",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "text-brand-800 underline underline-offset-4 hover:bg-brand-50"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-base font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mb-1.5 text-sm text-ink/70">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-brand-700 ${className}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-brand-700 ${className}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 text-base text-ink focus:border-brand-700 ${className}`}
    >
      {children}
    </select>
  );
}

export function Card({
  title,
  children,
  className = ""
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {title && <h2 className="mb-3 text-xl font-bold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

export function Notice({
  kind = "info",
  children
}: {
  kind?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    info: "border-brand-300 bg-brand-50 text-brand-900",
    success: "border-brand-400 bg-brand-100 text-brand-900",
    warning: "border-sand-300 bg-sand-100 text-alert",
    error: "border-danger/40 bg-red-50 text-danger"
  };
  const icons: Record<string, string> = { info: "ℹ", success: "✓", warning: "⚠", error: "✕" };
  return (
    <div role="status" className={`flex items-start gap-2.5 rounded-xl border-2 p-4 text-base ${styles[kind]}`}>
      <span aria-hidden="true" className="font-bold">
        {icons[kind]}
      </span>
      <div>{children}</div>
    </div>
  );
}

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "sand" | "alert" | "danger" }) {
  const tones: Record<string, string> = {
    brand: "bg-brand-100 text-brand-900 border-brand-300",
    sand: "bg-sand-100 text-ink border-sand-300",
    alert: "bg-amber-100 text-alert border-amber-300",
    danger: "bg-red-100 text-danger border-red-300"
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}
