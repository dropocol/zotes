import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** One hairline-divided stat cell inside a KpiBand grid.
 *  Zounty design: uppercase icon label on top, large tabular value,
 *  muted sub-line, optional link + colored value. Safe in server components. */
export function KpiCell({
  icon: Icon,
  label,
  value,
  sub,
  href,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: React.ReactNode;
  href?: string;
  valueClassName?: string;
}) {
  const inner = (
    <div className="flex h-full flex-col justify-between gap-3 p-4 md:p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div>
        <div
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight",
            valueClassName,
          )}
        >
          {value}
        </div>
        {sub && (
          <div className="mt-1 text-xs tabular-nums text-muted-foreground">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block h-full bg-card transition-colors hover:bg-muted/40"
    >
      {inner}
    </Link>
  ) : (
    <div className="h-full bg-card">{inner}</div>
  );
}

/** Outer card for a KPI band: children should be KpiCell elements laid out in
 *  a gap-px bg-border grid so cells read as hairline-divided. */
export function KpiBand({
  children,
  className,
  colsClassName = "grid-cols-2 md:grid-cols-4",
}: {
  children: React.ReactNode;
  className?: string;
  colsClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>
      <div className={cn("grid gap-px bg-border", colsClassName)}>
        {children}
      </div>
    </div>
  );
}
