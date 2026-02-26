"use client";

import * as React from "react";
import {
  Linkedin,
  MessageSquare,
  Facebook,
  Twitter,
  Building2,
  UserPlus,
  Briefcase,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobSourceDisplayName } from "@/types/jobs";
import type { JobSource } from "@prisma/client";

interface SourceIconProps {
  source: JobSource;
  className?: string;
  showLabel?: boolean;
}

const iconMap: Record<JobSource, React.ComponentType<{ className?: string }>> = {
  LINKEDIN: Linkedin,
  SLACK: MessageSquare,
  FACEBOOK: Facebook,
  X: Twitter,
  COMPANY_WEBSITE: Building2,
  REFERRAL: UserPlus,
  JOB_BOARD: Briefcase,
  OTHER: MoreHorizontal,
};

export function SourceIcon({ source, className, showLabel = false }: SourceIconProps) {
  const Icon = iconMap[source];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className="size-4" />
      {showLabel && (
        <span className="text-sm">{getJobSourceDisplayName(source)}</span>
      )}
    </div>
  );
}
