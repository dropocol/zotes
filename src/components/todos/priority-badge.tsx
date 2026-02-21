"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
