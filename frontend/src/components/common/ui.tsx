import type { ReactNode } from "react";

export function Card(props: { title: string; description?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/10 bg-slate-950/25 p-5 shadow-[0_0_0_1px_rgba(245,158,11,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-50">{props.title}</div>
          {props.description ? <div className="mt-1 text-sm text-slate-300">{props.description}</div> : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      {props.children ? <div className="mt-4">{props.children}</div> : null}
    </div>
  );
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const variant = props.variant ?? "primary";
  const className =
    variant === "primary"
      ? "bg-gradient-to-b from-amber-200/25 to-amber-500/10 text-amber-50 ring-1 ring-amber-200/20 hover:from-amber-200/35 hover:to-amber-500/15"
      : variant === "secondary"
        ? "bg-slate-950/20 text-slate-50 ring-1 ring-amber-200/15 hover:bg-slate-950/35"
        : "bg-transparent text-slate-200 hover:bg-slate-950/35";

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={[
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
        "shadow-sm shadow-amber-500/10",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      className="w-full rounded-md border border-slate-200/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/30 focus:outline-none"
    />
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="rounded-md border border-slate-200/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400/30 focus:outline-none"
    >
      {props.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Badge(props: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-amber-200/10 px-2 py-1 text-xs text-amber-100 ring-1 ring-amber-200/15">
      {props.children}
    </span>
  );
}



