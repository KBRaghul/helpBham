// Small, shared UI primitives so every screen uses the same type scale,
// spacing and colours. Keep this file dependency-free.

import type { ComponentProps, ReactNode } from "react";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* Typography --------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cx(
        "text-xs font-medium uppercase tracking-wider text-zinc-500",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/* Surfaces ----------------------------------------------------------------- */

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cx("rounded-xl border border-zinc-200 bg-white p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MapFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[420px] lg:h-[calc(100vh-220px)] min-h-[420px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
      {children}
    </p>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "danger" | "success";
  children: ReactNode;
}) {
  const tones = {
    info: "border-zinc-200 bg-zinc-50 text-zinc-700",
    danger: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-lg border px-3 py-2 text-sm", tones[tone])}>
      {children}
    </div>
  );
}

/* Controls ----------------------------------------------------------------- */

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-700",
    secondary: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-900">{label}</span>
      {hint && <span className="ml-1 text-xs text-zinc-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 " +
  "focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputCls, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(inputCls, "py-2", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(inputCls, "h-10", className)} {...props} />;
}

export function Chip({
  active,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
        className,
      )}
      {...props}
    />
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-zinc-100 p-1">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cx(
            "h-8 rounded-md px-3 text-sm font-medium transition-colors",
            value === it.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-900">{children}</dd>
    </div>
  );
}
