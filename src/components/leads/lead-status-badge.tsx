"use client";

import { cn } from "@/lib/utils";
import { getLeadStatusColor, getLeadStatusDisplayName } from "@/types/leads";
import type { LeadStatus } from "@prisma/client";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const colors = getLeadStatusColor(status);

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
      {getLeadStatusDisplayName(status)}
    </span>
  );
}
