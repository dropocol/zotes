"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusDisplayName } from "@/types/jobs";
import type { JobApplicationStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: JobApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = getStatusColor(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {getStatusDisplayName(status)}
    </span>
  );
}
