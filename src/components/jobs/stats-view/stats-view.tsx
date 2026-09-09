"use client";

import * as React from "react";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  Send,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { SourceIcon } from "../shared/source-icon";
import { ActivityChart } from "./activity-chart";
import { KpiCell, KpiBand } from "@/components/kpi-band";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getInterviewTypeDisplayName,
  getJobSourceDisplayName,
  getStatusDisplayName,
} from "@/types/jobs";
import type {
  InterviewType,
  JobApplicationStatus,
  JobSource,
  JobStats,
} from "@/types/jobs";

interface StatsViewProps {
  stats: JobStats | null;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function num(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const rangeLabels: Record<string, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  "6m": "last 26 weeks",
  "1y": "last 52 weeks",
  all: "all time",
};

const statusColors: Record<string, string> = {
  SAVED: "bg-slate-400",
  APPLIED: "bg-blue-500",
  PHONE_SCREEN: "bg-cyan-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-violet-500",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-gray-400",
  NO_RESPONSE: "bg-purple-400",
};

// SVG strokes can't use Tailwind bg-* utilities, so the donut uses raw values
const statusStrokes: Record<string, string> = {
  SAVED: "#94a3b8",
  APPLIED: "#3b82f6",
  PHONE_SCREEN: "#06b6d4",
  INTERVIEW: "#f59e0b",
  OFFER: "#8b5cf6",
  REJECTED: "#ef4444",
  WITHDRAWN: "#9ca3af",
  NO_RESPONSE: "#c084fc",
};

// ---------------------------------------------------------------------------
// Consistency heatmap + streaks
// ---------------------------------------------------------------------------

function Heatmap({ stats }: { stats: JobStats }) {
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < stats.heatmap.length; i += 7) {
    weeks.push(stats.heatmap.slice(i, i + 7));
  }
  const maxCount = Math.max(1, ...stats.heatmap.map((d) => d.count));
  const level = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count <= maxCount / 4) return "bg-emerald-200 dark:bg-emerald-900";
    if (count <= maxCount / 2) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-500 dark:bg-emerald-500";
  };

  const { currentStreak, longestStreak, activeDays } = stats.pace;

  return (
    <div className="stat-fade-up rounded-xl border bg-card" style={{ animationDelay: "180ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 className="font-medium">Consistency</h3>
          <p className="text-xs text-muted-foreground">Daily applications, last 26 weeks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
            <Flame className="size-3.5" />
            {currentStreak} day streak
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            <Trophy className="size-3.5" />
            best: {longestStreak}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex">
            {activeDays} active days
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex w-full flex-col gap-1.5">
          {/* month labels, aligned over the week columns */}
          <div className="flex gap-1 pl-6">
            {weeks.map((w, i) => {
              const month = format(parseISO(w[0].date + "T00:00:00Z"), "MMM");
              const prev = i > 0 ? format(parseISO(weeks[i - 1][0].date + "T00:00:00Z"), "MMM") : null;
              return (
                <div key={w[0].date} className="min-w-0 flex-1 text-[10px] leading-none text-muted-foreground">
                  {month !== prev ? month : ""}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {/* weekday labels */}
            <div className="grid w-5 shrink-0 grid-rows-7 gap-1 text-[10px] leading-none text-muted-foreground">
              <span className="flex items-center">M</span>
              <span />
              <span className="flex items-center">W</span>
              <span />
              <span className="flex items-center">F</span>
              <span />
              <span />
            </div>
            {/* grid — cells scale with the card width */}
            <div className="flex flex-1 gap-1">
              {weeks.map((week) => (
                <div key={week[0].date} className="flex min-w-0 flex-1 flex-col gap-1">
                  {week.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "aspect-square w-full rounded-[3px] transition-transform hover:scale-110 hover:ring-2 hover:ring-emerald-500/50",
                            level(day.count),
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">
                          {day.count} application{day.count === 1 ? "" : "s"}
                        </p>
                        <p className="opacity-80">
                          {format(parseISO(day.date + "T00:00:00Z"), "EEE, d MMM yyyy")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* legend */}
          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            Less
            <span className="size-3 rounded-[2px] bg-muted" />
            <span className="size-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
            <span className="size-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
            <span className="size-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
            More
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

function Funnel({ stats }: { stats: JobStats }) {
  const { applied, responded, interviewed, offers } = stats.funnel;
  const stages = [
    { label: "Applied", count: applied, bar: "bg-emerald-500" },
    { label: "Responded", count: responded, bar: "bg-sky-500" },
    { label: "Interviewed", count: interviewed, bar: "bg-amber-500" },
    { label: "Offers", count: offers, bar: "bg-violet-500" },
  ];
  const top = Math.max(1, applied);

  return (
    <div className="stat-fade-up rounded-xl border bg-card" style={{ animationDelay: "240ms" }}>
      <div className="border-b p-4">
        <h3 className="font-medium">Pipeline funnel</h3>
        <p className="text-xs text-muted-foreground">How applications convert downstream</p>
      </div>
      <div className="space-y-4 p-4">
        {stages.map((stage, i) => {
          const prev = i > 0 ? stages[i - 1].count : null;
          const conversion = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null;
          return (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{stage.label}</span>
                <span className="flex items-center gap-2">
                  {conversion !== null && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {conversion}% of {stages[i - 1].label.toLowerCase()}
                    </span>
                  )}
                  <span className="font-mono font-semibold tabular-nums">{stage.count}</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("stat-rise h-full rounded-full", stage.bar)}
                  style={{
                    width: `${Math.max((stage.count / top) * 100, stage.count > 0 ? 2 : 0)}%`,
                    animationDelay: `${300 + i * 100}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status donut
// ---------------------------------------------------------------------------

function StatusDonut({ stats }: { stats: JobStats }) {
  const entries = Object.entries(stats.byStatus).filter(([, c]) => c > 0);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  const R = 15.9155;

  let cumulative = 0;

  return (
    <div className="stat-fade-up rounded-xl border bg-card" style={{ animationDelay: "300ms" }}>
      <div className="border-b p-4">
        <h3 className="font-medium">Status breakdown</h3>
        <p className="text-xs text-muted-foreground">Where every application stands</p>
      </div>
      <div className="p-4">
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No applications in this period
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative shrink-0">
              <svg viewBox="0 0 42 42" className="size-40">
                <circle cx="21" cy="21" r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
                {entries.map(([status, count]) => {
                  const len = (count / total) * 100;
                  const dash = `${len} ${100 - len}`;
                  const offset = 25 - cumulative;
                  cumulative += len;
                  return (
                    <circle
                      key={status}
                      cx="21"
                      cy="21"
                      r={R}
                      fill="none"
                      strokeWidth="5"
                      strokeDasharray={dash}
                      strokeDashoffset={offset}
                      stroke={statusStrokes[status] ?? "#94a3b8"}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-semibold tabular-nums">{total}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">jobs</span>
              </div>
            </div>
            <div className="w-full flex-1 space-y-1.5">
              {entries.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", statusColors[status] ?? "bg-slate-400")} />
                    {getStatusDisplayName(status as JobApplicationStatus)}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-mono font-medium tabular-nums">{count}</span>
                    <span className="ml-1.5 text-xs">({Math.round((count / total) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source performance
// ---------------------------------------------------------------------------

function SourcePerformance({ stats }: { stats: JobStats }) {
  const rows = Object.entries(stats.responseRateBySource)
    .filter(([, d]) => d.total > 0)
    .sort((a, b) => b[1].rate - a[1].rate || b[1].total - a[1].total);

  return (
    <div className="stat-fade-up rounded-xl border bg-card" style={{ animationDelay: "360ms" }}>
      <div className="border-b p-4">
        <h3 className="font-medium">Source performance</h3>
        <p className="text-xs text-muted-foreground">Which channels actually reply</p>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No applications in this period
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map(([source, data]) => (
              <div key={source} className="flex items-center gap-3">
                <SourceIcon source={source as JobSource} className="shrink-0 text-muted-foreground" />
                <span className="w-28 truncate text-sm">
                  {getJobSourceDisplayName(source as JobSource)}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="stat-rise h-full rounded-full bg-linear-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${data.rate}%`, animationDelay: "350ms" }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-sm font-medium tabular-nums">
                  {data.rate}%
                </span>
                <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                  {data.responded}/{data.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming interviews
// ---------------------------------------------------------------------------

function UpcomingInterviews({ stats }: { stats: JobStats }) {
  const upcoming = stats.upcomingInterviews;

  return (
    <div className="stat-fade-up rounded-xl border bg-card" style={{ animationDelay: "420ms" }}>
      <div className="border-b p-4">
        <h3 className="font-medium">Upcoming interviews</h3>
        <p className="text-xs text-muted-foreground">Next on your calendar</p>
      </div>
      <div className="p-4">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarClock className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nothing scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((interview) => {
              const date = parseISO(interview.scheduledAt);
              return (
                <div key={interview.id} className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500/10 leading-none">
                    <span className="text-[10px] font-medium uppercase text-amber-600 dark:text-amber-400">
                      {format(date, "MMM")}
                    </span>
                    <span className="font-mono text-base font-semibold text-amber-600 dark:text-amber-400">
                      {format(date, "d")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{interview.companyName}</p>
                    <p className="truncate text-xs text-muted-foreground">{interview.jobTitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium">
                      {getInterviewTypeDisplayName(interview.type as InterviewType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R{interview.roundNumber} · {format(date, "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function StatsView({ stats }: StatsViewProps) {
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const { summary, pace } = stats;

  if (summary.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20">
        <Inbox className="size-8 text-muted-foreground" />
        <p className="font-medium">No applications in this period</p>
        <p className="text-sm text-muted-foreground">
          Try a wider range, or add a job to see your stats here.
        </p>
      </div>
    );
  }

  const delta =
    pace.prevPeriodApplied !== null && pace.prevPeriodApplied > 0
      ? Math.round(((summary.applied - pace.prevPeriodApplied) / pace.prevPeriodApplied) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* KPI band — one card, hairline-divided cells (zounty design) */}
      <KpiBand className="stat-fade-up" colsClassName="grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <KpiCell
            icon={Briefcase}
            label="Applications"
            value={String(summary.applied)}
            sub={
              delta !== null ? (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    delta >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {delta >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {Math.abs(delta)}% vs prev
                </span>
              ) : (
                rangeLabels[stats.range] ?? stats.range
              )
            }
            href="/jobs/list"
          />
          <KpiCell
            icon={Send}
            label="Avg / day"
            value={num(pace.avgPerDay)}
            sub={`${num(pace.avgPerWeek)}/week pace`}
          />
          <KpiCell
            icon={CheckCircle2}
            label="Response rate"
            value={`${summary.responseRate}%`}
            sub={`${summary.responded} of ${summary.applied} replied`}
          />
          <KpiCell
            icon={Clock}
            label="Avg reply"
            value={
              summary.avgResponseDays !== null
                ? `${num(summary.avgResponseDays)}d`
                : "—"
            }
            sub="days to hear back"
          />
          <KpiCell
            icon={Users}
            label="Interviews"
            value={String(summary.totalInterviews)}
            sub={`${summary.jobsWithInterviews} jobs · ${summary.interviewRate}%`}
            href="/jobs/calendar"
          />
          <KpiCell
            icon={Trophy}
            label="Offers"
            value={String(summary.offers)}
            sub={`${summary.offerRate}% of applications`}
            valueClassName={
              summary.offers > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : undefined
            }
            href="/jobs/list"
          />
      </KpiBand>

      {/* Main activity chart */}
      <ActivityChart series={stats.series} bucket={stats.bucket} />

      {/* Consistency heatmap */}
      <Heatmap stats={stats} />

      {/* Funnel + status donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Funnel stats={stats} />
        <StatusDonut stats={stats} />
      </div>

      {/* Sources + upcoming interviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SourcePerformance stats={stats} />
        <UpcomingInterviews stats={stats} />
      </div>
    </div>
  );
}
