"use client";

import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function RecurringBadge({ className, showLabel = false }: RecurringBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400",
        className
      )}
      title="Recurring task"
    >
      <Repeat className="h-3.5 w-3.5" />
      {showLabel && <span>Recurring</span>}
    </div>
  );
}
