import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
  danger:
    "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50",
};

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function LinkButton({ variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return <Link className={buttonClass[variant]} {...props} />;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="text-sm text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}
