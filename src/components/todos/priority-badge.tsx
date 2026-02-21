"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "L",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100",
  },
  medium: {
    label: "M",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-100",
  },
  high: {
    label: "H",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 hover:bg-orange-100",
  },
  urgent: {
    label: "!",
    className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-100 font-bold",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] px-1.5 py-0 h-4 font-medium rounded",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
