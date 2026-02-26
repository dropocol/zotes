"use client";

import { cn } from "@/lib/utils";
import { RecurringCompletionStatus } from "@/types/recurring";

interface CompletionCellProps {
  status: string;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}

const statusStyles = {
  [RecurringCompletionStatus.TODO]: {
    bg: "bg-muted hover:bg-muted/80",
    icon: "○",
    text: "text-muted-foreground",
  },
  [RecurringCompletionStatus.DONE]: {
    bg: "bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60",
    icon: "✓",
    text: "text-green-600 dark:text-green-400",
  },
  [RecurringCompletionStatus.SKIPPED]: {
    bg: "bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60",
    icon: "⊘",
    text: "text-amber-600 dark:text-amber-400",
  },
};

export function CompletionCell({
  status,
  onClick,
  className,
  size = "md",
}: CompletionCellProps) {
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.todo;
  const sizeClasses = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md flex items-center justify-center font-medium transition-colors cursor-pointer",
        sizeClasses,
        style.bg,
        style.text,
        className
      )}
      title={`Status: ${status}`}
    >
      {style.icon}
    </button>
  );
}
