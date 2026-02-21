"use client";

import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableTableHeadProps {
  column: string;
  label: string;
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableTableHead({
  column,
  label,
  sortConfig,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = sortConfig.key === column;
  const direction = isActive ? sortConfig.direction : null;

  const handleClick = () => {
    onSort(column);
  };

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium hover:bg-muted/50"
        onClick={handleClick}
      >
        {label}
        <span className="ml-2">
          {direction === "asc" && <ArrowUp className="h-4 w-4" />}
          {direction === "desc" && <ArrowDown className="h-4 w-4" />}
          {direction === null && (
            <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
          )}
        </span>
      </Button>
    </TableHead>
  );
}

export function getSortedValue<T>(item: T, key: string): string | number | null {
  const keys = key.split(".");
  let value: unknown = item;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  return (value as string | number | null) ?? null;
}

export function sortItems<T>(items: T[] | undefined | null, sortConfig: SortConfig): T[] {
  if (!items || !Array.isArray(items)) return [];
  if (!sortConfig.direction) return items;

  const sorted = [...items].sort((a, b) => {
    const aValue = getSortedValue(a, sortConfig.key);
    const bValue = getSortedValue(b, sortConfig.key);

    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}
