// ============================================================================
// PRAYER TYPES
// ============================================================================

// Re-export from Prisma generated types
import { PrayerType, PrayerStatus } from "@prisma/client";

export { PrayerType, PrayerStatus };

export const PRAYER_TYPES: PrayerType[] = [
  "FAJR",
  "ZOHAR",
  "ASR",
  "MAGHRIB",
  "ISHA",
  "JUMAH",
];

export const PRAYER_STATUSES: PrayerStatus[] = ["YES", "NO", "NO_QASR", "QAZAA", "QAZAA_QASR"];

// ============================================================================
// CALENDAR VIEW TYPES
// ============================================================================

export const CalendarView = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type CalendarViewType =
  (typeof CalendarView)[keyof typeof CalendarView];

// ============================================================================
// PRAYER RECORD TYPE
// ============================================================================

export interface PrayerRecord {
  id: string;
  date: Date;
  prayer: PrayerType;
  status: PrayerStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

import { getDay } from "date-fns";

/**
 * Get the prayers for a specific date.
 * On Friday, Jumah replaces Zohar.
 */
export function getPrayersForDate(date: Date): PrayerType[] {
  const dayOfWeek = getDay(date);
  const isFriday = dayOfWeek === 5;

  return [
    "FAJR",
    isFriday ? "JUMAH" : "ZOHAR",
    "ASR",
    "MAGHRIB",
    "ISHA",
  ];
}

/**
 * Get the display name for a prayer type
 */
export function getPrayerDisplayName(prayer: PrayerType): string {
  const names: Record<PrayerType, string> = {
    FAJR: "Fajr",
    ZOHAR: "Zohar",
    ASR: "Asr",
    MAGHRIB: "Maghrib",
    ISHA: "Isha",
    JUMAH: "Jumah",
  };
  return names[prayer];
}

/**
 * Get the display name for a prayer status
 */
export function getStatusDisplayName(status: PrayerStatus): string {
  const names: Record<PrayerStatus, string> = {
    YES: "Prayed",
    NO: "Not Prayed",
    QAZAA: "Qazaa",
    NO_QASR: "Not Prayed (Qasr)",
    QAZAA_QASR: "Qazaa (Qasr)",
  };
  return names[status];
}

/**
 * Get the background color for a prayer status
 */
export function getStatusBgColor(status: PrayerStatus): string {
  const colors: Record<PrayerStatus, string> = {
    YES: "bg-emerald-500",
    NO: "bg-muted",
    QAZAA: "bg-amber-500",
    NO_QASR: "bg-sky-500",
    QAZAA_QASR: "bg-indigo-500",
  };
  return colors[status];
}

/**
 * Get the text color for a prayer status
 */
export function getStatusTextColor(status: PrayerStatus): string {
  const colors: Record<PrayerStatus, string> = {
    YES: "text-emerald-700 dark:text-emerald-400",
    NO: "text-muted-foreground",
    QAZAA: "text-amber-700 dark:text-amber-400",
    NO_QASR: "text-sky-700 dark:text-sky-400",
    QAZAA_QASR: "text-indigo-700 dark:text-indigo-400",
  };
  return colors[status];
}

/**
 * Get the ring/border color for a prayer status
 */
export function getStatusRingColor(status: PrayerStatus): string {
  const colors: Record<PrayerStatus, string> = {
    YES: "border-emerald-200 dark:border-emerald-800/50",
    NO: "border-border",
    QAZAA: "border-amber-200 dark:border-amber-800/50",
    NO_QASR: "border-sky-200 dark:border-sky-800/50",
    QAZAA_QASR: "border-indigo-200 dark:border-indigo-800/50",
  };
  return colors[status];
}

/**
 * Get the dot indicator color for a prayer status (used in calendar cells)
 */
export function getStatusDotColor(status: PrayerStatus): string {
  const colors: Record<PrayerStatus, string> = {
    YES: "bg-emerald-500",
    NO: "bg-muted-foreground/40",
    QAZAA: "bg-amber-500",
    NO_QASR: "bg-sky-500",
    QAZAA_QASR: "bg-indigo-500",
  };
  return colors[status];
}

// Legacy alias for backward compatibility
export const getStatusColor = getStatusDotColor;

/**
 * Get prayer time range hint
 */
export function getPrayerTimeHint(prayer: PrayerType): string {
  const hints: Record<PrayerType, string> = {
    FAJR: "Before sunrise",
    ZOHAR: "Midday",
    ASR: "Afternoon",
    MAGHRIB: "After sunset",
    ISHA: "Night",
    JUMAH: "Friday congregation",
  };
  return hints[prayer];
}

/**
 * Get prayer icon name (for Lucide icons)
 */
export function getPrayerIconName(prayer: PrayerType): string {
  const icons: Record<PrayerType, string> = {
    FAJR: "Sunrise",
    ZOHAR: "Sun",
    ASR: "CloudSun",
    MAGHRIB: "Sunset",
    ISHA: "Moon",
    JUMAH: "Users",
  };
  return icons[prayer];
}
