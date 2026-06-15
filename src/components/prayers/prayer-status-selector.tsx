"use client";

import * as React from "react";
import { Check, Sun, Sunrise, Sunset, Moon, CloudSun, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PrayerStatus,
  PrayerType,
  PRAYER_STATUSES,
  getStatusDisplayName,
  getPrayerDisplayName,
  getPrayerTimeHint,
} from "@/types/prayers";

interface PrayerStatusSelectorProps {
  prayer: PrayerType;
  status: PrayerStatus;
  onStatusChange: (prayer: PrayerType, status: PrayerStatus) => void;
  disabled?: boolean;
  compact?: boolean;
}


const PRAYER_ICONS: Record<PrayerType, React.ComponentType<{ className?: string }>> = {
  FAJR: Sunrise,
  ZOHAR: Sun,
  ASR: CloudSun,
  MAGHRIB: Sunset,
  ISHA: Moon,
  JUMAH: Users,
};

// Status colors following shadcn/ui patterns
const getStatusStyles = (status: PrayerStatus) => {
  switch (status) {
    case PrayerStatus.YES:
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/50",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: "text-emerald-600 dark:text-emerald-500",
        indicator: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
        hover: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800/50",
      };
    case PrayerStatus.QAZAA:
      return {
        bg: "bg-amber-100 dark:bg-amber-950/50",
        text: "text-amber-700 dark:text-amber-400",
        icon: "text-amber-600 dark:text-amber-500",
        indicator: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
        hover: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/50",
      };
    case PrayerStatus.NO_QASR:
      return {
        bg: "bg-sky-100 dark:bg-sky-950/50",
        text: "text-sky-700 dark:text-sky-400",
        icon: "text-sky-600 dark:text-sky-500",
        indicator: "bg-sky-500",
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
        hover: "hover:bg-sky-50 dark:hover:bg-sky-950/30",
        border: "border-sky-200 dark:border-sky-800/50",
      };
    case PrayerStatus.QAZAA_QASR:
      return {
        bg: "bg-indigo-100 dark:bg-indigo-950/50",
        text: "text-indigo-700 dark:text-indigo-400",
        icon: "text-indigo-600 dark:text-indigo-500",
        indicator: "bg-indigo-500",
        badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",
        hover: "hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
        border: "border-indigo-200 dark:border-indigo-800/50",
      };
    case PrayerStatus.NO:
    default:
      return {
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        icon: "text-muted-foreground",
        indicator: "bg-muted-foreground/40",
        badge: "bg-muted text-muted-foreground",
        hover: "hover:bg-muted/80",
        border: "border-border",
      };
  }
};

export function PrayerStatusSelector({
  prayer,
  status,
  onStatusChange,
  disabled = false,
  compact = false,
}: PrayerStatusSelectorProps) {
  const Icon = PRAYER_ICONS[prayer];
  const styles = getStatusStyles(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all w-full text-left",
            "hover:shadow-sm",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            styles.border,
            styles.bg,
            compact && "py-2 gap-2 px-2.5"
          )}
          disabled={disabled}
        >
          <div className={cn(
            "flex items-center justify-center rounded-md p-1.5",
            status === PrayerStatus.YES && "bg-emerald-500",
            status === PrayerStatus.QAZAA && "bg-amber-500",
            status === PrayerStatus.NO_QASR && "bg-sky-500",
            status === PrayerStatus.QAZAA_QASR && "bg-indigo-500",
            status === PrayerStatus.NO && "bg-muted"
          )}>
            <Icon className={cn(
              "size-4",
              (status === PrayerStatus.YES || status === PrayerStatus.QAZAA || status === PrayerStatus.NO_QASR || status === PrayerStatus.QAZAA_QASR) && "text-white",
              status === PrayerStatus.NO && "text-muted-foreground"
            )} />
          </div>
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className={cn(
              "font-medium truncate",
              styles.text
            )}>
              {getPrayerDisplayName(prayer)}
            </span>
            {!compact && (
              <span className="text-xs text-muted-foreground">
                {getPrayerTimeHint(prayer)}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-md",
              styles.badge
            )}>
              {getStatusDisplayName(status)}
            </span>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {PRAYER_STATUSES.map((option) => {
          const optionStyles = getStatusStyles(option);
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(prayer, option)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                status === option && "bg-accent"
              )}
            >
              <div className={cn(
                "size-4 rounded-full",
                optionStyles.indicator
              )} />
              <span className="flex-1 font-medium">{getStatusDisplayName(option)}</span>
              {status === option && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact pill version for calendar sidebar
export function PrayerStatusPill({
  prayer,
  status,
  onStatusChange,
  disabled = false,
}: PrayerStatusSelectorProps) {
  const Icon = PRAYER_ICONS[prayer];
  const styles = getStatusStyles(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all w-full text-left",
            "hover:shadow-sm",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            styles.border,
            styles.bg
          )}
          disabled={disabled}
        >
          <div className={cn(
            "flex items-center justify-center rounded-md p-1",
            status === PrayerStatus.YES && "bg-emerald-500",
            status === PrayerStatus.QAZAA && "bg-amber-500",
            status === PrayerStatus.NO_QASR && "bg-sky-500",
            status === PrayerStatus.QAZAA_QASR && "bg-indigo-500",
            status === PrayerStatus.NO && "bg-muted"
          )}>
            <Icon className={cn(
              "size-3.5",
              (status === PrayerStatus.YES || status === PrayerStatus.QAZAA || status === PrayerStatus.NO_QASR || status === PrayerStatus.QAZAA_QASR) && "text-white",
              status === PrayerStatus.NO && "text-muted-foreground"
            )} />
          </div>
          <span className={cn(
            "text-sm font-medium flex-1",
            styles.text
          )}>
            {getPrayerDisplayName(prayer)}
          </span>
          <div className={cn(
            "size-2.5 rounded-full",
            styles.indicator
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {PRAYER_STATUSES.map((option) => {
          const optionStyles = getStatusStyles(option);
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(prayer, option)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className={cn(
                "size-3 rounded-full",
                optionStyles.indicator
              )} />
              <span className="flex-1 text-sm">{getStatusDisplayName(option)}</span>
              {status === option && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
