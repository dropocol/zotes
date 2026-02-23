"use client";

import * as React from "react";
import { Check, Sun, Sunrise, Sunset, Moon, CloudSun, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  getStatusBgColor,
  getStatusTextColor,
  getStatusRingColor,
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

export function PrayerStatusSelector({
  prayer,
  status,
  onStatusChange,
  disabled = false,
  compact = false,
}: PrayerStatusSelectorProps) {
  const Icon = PRAYER_ICONS[prayer];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all",
            "hover:shadow-sm",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            getStatusRingColor(status),
            compact ? "text-sm" : "text-base"
          )}
          disabled={disabled}
        >
          <div className={cn(
            "flex items-center justify-center rounded-full p-1.5",
            getStatusBgColor(status)
          )}>
            <Icon className={cn("size-4", status === "YES" ? "text-white" : "text-slate-600 dark:text-slate-300")} />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-medium truncate">
              {getPrayerDisplayName(prayer)}
            </span>
            {!compact && (
              <span className="text-xs text-muted-foreground">
                {getPrayerTimeHint(prayer)}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              getStatusBgColor(status),
              status === "YES" ? "text-white" : "text-slate-700 dark:text-slate-200"
            )}>
              {getStatusDisplayName(status)}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {STATUS_OPTIONS.map((option) => (
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
              getStatusBgColor(option)
            )} />
            <span className="flex-1 font-medium">{getStatusDisplayName(option)}</span>
            {status === option && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all w-full text-left",
            "hover:shadow-sm",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            getStatusRingColor(status)
          )}
          disabled={disabled}
        >
          <div className={cn(
            "flex items-center justify-center rounded-full p-1",
            getStatusBgColor(status)
          )}>
            <Icon className={cn("size-3", status === "YES" ? "text-white" : "text-slate-600 dark:text-slate-300")} />
          </div>
          <span className="text-sm font-medium flex-1">
            {getPrayerDisplayName(prayer)}
          </span>
          <div className={cn(
            "size-2 rounded-full",
            getStatusBgColor(status)
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onStatusChange(prayer, option)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={cn(
              "size-3 rounded-full",
              getStatusBgColor(option)
            )} />
            <span className="flex-1 text-sm">{getStatusDisplayName(option)}</span>
            {status === option && <Check className="size-3 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
