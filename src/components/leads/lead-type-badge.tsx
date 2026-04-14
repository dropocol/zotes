"use client";

import { Badge } from "@/components/ui/badge";
import { getLeadTypeDisplayName, getLeadTypeColor } from "@/types/leads";
import type { LeadType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface LeadTypeBadgeProps {
  type: LeadType;
  className?: string;
}

export function LeadTypeBadge({ type, className }: LeadTypeBadgeProps) {
  const colors = getLeadTypeColor(type);
  const displayName = getLeadTypeDisplayName(type);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {displayName}
    </Badge>
  );
}
