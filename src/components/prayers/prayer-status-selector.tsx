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

const STATUS_OPTIONS: PrayerStatus[] = ["YES", "NO", "QAZAA"];

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
    case "YES":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/50",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: "text-emerald-600 dark:text-emerald-500",
        indicator: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
        hover: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800/50",
      };
    case "QAZAA":
      return {
        bg: "bg-amber-100 dark:bg-amber-950/50",
        text: "text-amber-700 dark:text-amber-400",
        icon: "text-amber-600 dark:text-amber-500",
        indicator: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
        hover: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/50",
      };
    case "NO":
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
            status === "YES" && "bg-emerald-500",
            status === "QAZAA" && "bg-amber-500",
            status === "NO" && "bg-muted"
          )}>
            <Icon className={cn(
              "size-4",
              status === "YES" && "text-white",
              status === "QAZAA" && "text-white",
              status === "NO" && "text-muted-foreground"
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
      <DropdownMenuContent align="end" className="w-44">
        {STATUS_OPTIONS.map((option) => {
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
            status === "YES" && "bg-emerald-500",
            status === "QAZAA" && "bg-amber-500",
            status === "NO" && "bg-muted"
          )}>
            <Icon className={cn(
              "size-3.5",
              status === "YES" && "text-white",
              status === "QAZAA" && "text-white",
              status === "NO" && "text-muted-foreground"
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
      <DropdownMenuContent align="end" className="w-36">
        {STATUS_OPTIONS.map((option) => {
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
