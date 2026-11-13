import React from "react";
import { IconAlert, IconCheck, IconInfo, IconX } from "./icons";

/**
 * Primitivas de interface.
 * Regras do design system:
 * - alvo de toque mínimo de 44–48px;
 * - um único estilo de ação primária (verde sólido) por tela;
 * - labels sempre visíveis (sem placeholder como rótulo);
 * - erros ligados ao campo via aria-describedby, não só por cor.
 */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ────────────────────────────── Botões ────────────────────────────── */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-55 active:translate-y-px";

const BUTTON_VARIANTS = {
  primary: "bg-brand-700 text-white shadow-soft hover:bg-brand-800",
  secondary: "border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
  soft: "bg-brand-100 text-brand-900 hover:bg-brand-200",
  ghost: "text-brand-800 hover:bg-brand-50",
  danger: "bg-danger text-white hover:brightness-110",
  onDark: "bg-white text-brand-900 hover:bg-brand-50"
} as const;

const BUTTON_SIZES = {
  sm: "min-h-[40px] px-3.5 py-2 text-sm",
  md: "min-h-[44px] px-4 py-2.5 text-sm",
  lg: "min-h-[52px] px-6 py-3.5 text-base"
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Botão quadrado só com ícone — exige `aria-label`. */
export function IconButton({
  label,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────── Formulário ────────────────────────────── */

const FIELD_CONTROL =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink shadow-[0_1px_0_rgba(16,34,28,0.03)] transition-colors placeholder:text-muted/60 hover:border-ink/25 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-700/10";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  optional,
  children
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (obrigatório)</span>}
        </label>
        {optional && <span className="text-2xs font-semibold uppercase tracking-wide text-muted">opcional</span>}
      </div>
      {hint && (
        <p id={hintId} className="mb-2 text-sm leading-snug text-muted">
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

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(FIELD_CONTROL, className)} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(FIELD_CONTROL, "resize-y", className)} />;
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(FIELD_CONTROL, "appearance-none pr-10", className)}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="m5 7.5 5 5 5-5" />
      </svg>
    </div>
  );
}

/* ────────────────────────────── Superfícies ────────────────────────────── */

export function Card({
  title,
  eyebrow,
  actions,
  children,
  className = "",
  padded = true
}: {
  title?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-soft",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {(title || actions || eyebrow) && (
        <header className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", padded ? "" : "p-5 pb-0")}>
          <div>
            {eyebrow && (
              <p className="text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">{eyebrow}</p>
            )}
            {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className = ""
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ────────────────────────────── Mensagens ────────────────────────────── */

const NOTICE_STYLES = {
  info: { box: "border-brand-200 bg-brand-50 text-brand-900", Icon: IconInfo },
  success: { box: "border-brand-300 bg-brand-50 text-brand-900", Icon: IconCheck },
  warning: { box: "border-amber-300 bg-amber-50 text-alert", Icon: IconAlert },
  error: { box: "border-red-300 bg-red-50 text-danger", Icon: IconX }
} as const;

export function Notice({
  kind = "info",
  title,
  children,
  className = ""
}: {
  kind?: keyof typeof NOTICE_STYLES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = NOTICE_STYLES[kind];
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm sm:text-base", box, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1", "leading-relaxed")}>{children}</div>}
      </div>
    </div>
  );
}

/* ────────────────────────────── Dados ────────────────────────────── */

const BADGE_TONES = {
  brand: "border-brand-200 bg-brand-50 text-brand-800",
  success: "border-brand-300 bg-brand-100 text-brand-900",
  neutral: "border-line bg-canvas text-muted",
  sand: "border-sand-300 bg-sand-100 text-ink",
  alert: "border-amber-300 bg-amber-50 text-alert",
  danger: "border-red-300 bg-red-50 text-danger"
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "brand",
  dot = false,
  className = ""
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.06em]",
        BADGE_TONES[tone],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
        {icon && <span className="text-brand-600">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold leading-none text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton h-4 w-full", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-10 text-center">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {icon}
        </span>
      )}
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ────────────────────────────── Navegação ────────────────────────────── */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: Array<{ value: T; label: string; hint?: string; icon?: React.ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid gap-2 rounded-2xl bg-white/60 p-1.5 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              active
                ? "border-brand-700 bg-white text-ink shadow-soft"
                : "border-transparent text-muted hover:bg-white/70 hover:text-ink"
            )}
          >
            {option.icon && (
              <span className={cn("shrink-0", active ? "text-brand-700" : "text-muted")}>{option.icon}</span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-bold">{option.label}</span>
              {option.hint && <span className="block text-xs font-normal text-muted">{option.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm" aria-label="Etapas">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold",
                state === "done" && "bg-brand-700 text-white",
                state === "current" && "border-2 border-brand-700 bg-white text-brand-800",
                state === "todo" && "border border-line bg-white text-muted"
              )}
            >
              {state === "done" ? <IconCheck size={13} /> : index + 1}
            </span>
            <span
              className={cn(
                "font-semibold",
                state === "todo" ? "text-muted" : "text-ink",
                index === current && "underline decoration-brand-300 decoration-2 underline-offset-4"
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && <span aria-hidden="true" className="mx-1 hidden h-px w-6 bg-line sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}
