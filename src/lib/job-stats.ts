import type { Prisma } from "@prisma/client";
import type {
  JobStats,
  StatsRange,
  StatsSeriesPoint,
} from "@/types/jobs";

export type JobWithInterviews = Prisma.JobApplicationGetPayload<{
  include: { interviews: true };
}>;

const DAY_MS = 86_400_000;

/** UTC date key "yyyy-MM-dd" — consistent with @db.Date columns stored at UTC midnight. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Monday-based week start (UTC midnight). */
function weekStart(date: Date): Date {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dow = (utc.getUTCDay() + 6) % 7; // Mon = 0
  return addDays(utc, -dow);
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** The date a job counts as "applied on"; saved jobs have no application date. */
/** Normalize a value that should be a Date; guards against stale Prisma
 * clients (missing fields arrive as undefined) or dates arriving as strings. */
function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function appliedDate(job: JobWithInterviews): Date | null {
  const date = toDate(job.dateApplied);
  if (date) return date;
  return job.status !== "SAVED" ? job.createdAt : null;
}

function interviewDate(
  interview: JobWithInterviews["interviews"][number],
): Date | null {
  return toDate(interview.completedAt ?? interview.scheduledAt);
}

interface Bucket {
  key: string;
  start: Date;
  end: Date;
  point: StatsSeriesPoint;
}

function buildBuckets(
  range: StatsRange,
  now: Date,
  earliest?: Date,
): { buckets: Bucket[]; bucket: JobStats["bucket"]; windowStart: Date } {
  const buckets: Bucket[] = [];

  if (range === "7d" || range === "30d" || range === "90d") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = addDays(now, -(days - 1));
    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const key = dayKey(day);
      buckets.push({
        key,
        start: day,
        end: addDays(day, 1),
        point: { date: key, applied: 0, responses: 0, interviews: 0 },
      });
    }
    return { buckets, bucket: "day", windowStart: start };
  }

  if (range === "6m" || range === "1y") {
    const weeks = range === "6m" ? 26 : 52;
    const currentWeek = weekStart(now);
    const start = addDays(currentWeek, -(weeks - 1) * 7);
    for (let i = 0; i < weeks; i++) {
      const week = addDays(start, i * 7);
      const key = dayKey(week);
      buckets.push({
        key,
        start: week,
        end: addDays(week, 7),
        point: { date: key, applied: 0, responses: 0, interviews: 0 },
      });
    }
    return { buckets, bucket: "week", windowStart: start };
  }

  // "all": monthly buckets from the earliest activity to the current month
  const first = earliest ?? now;
  const start = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let d = start; d <= end; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
    const key = monthKey(d);
    buckets.push({
      key,
      start: d,
      end: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
      point: { date: key, applied: 0, responses: 0, interviews: 0 },
    });
  }
  return { buckets, bucket: "month", windowStart: start };
}

function bucketFor(buckets: Bucket[], date: Date): Bucket | undefined {
  const t = date.getTime();
  return buckets.find((b) => t >= b.start.getTime() && t < b.end.getTime());
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Daily counts for the 26 weeks ending with the current week (Monday-aligned). */
function buildHeatmap(appliedCounts: Map<string, number>, now: Date) {
  const start = addDays(weekStart(now), -25 * 7);
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < 26 * 7; i++) {
    const day = addDays(start, i);
    const key = dayKey(day);
    heatmap.push({ date: key, count: appliedCounts.get(key) ?? 0 });
  }
  return heatmap;
}

/**
 * Compute the full stats payload for a user's jobs within a range window.
 * Jobs and interviews are passed in pre-fetched (the dataset is small), so the
 * API route, the stats page, and tests all share one implementation.
 */
export function computeJobStats(
  jobs: JobWithInterviews[],
  range: StatsRange,
  now: Date = new Date(),
): JobStats {
  const earliest = jobs.reduce<Date | null>((min, job) => {
    const candidates = [
      appliedDate(job),
      toDate(job.responseDate),
      ...job.interviews.map(interviewDate),
    ].filter((d): d is Date => d !== null);
    if (candidates.length === 0) return min;
    const jobMin = new Date(Math.min(...candidates.map((d) => d.getTime())));
    return !min || jobMin < min ? jobMin : min;
  }, null);

  const { buckets, bucket, windowStart } = buildBuckets(range, now, earliest ?? undefined);
  const windowEnd = now;
  const inWindow = (d: Date) =>
    d.getTime() >= windowStart.getTime() && d.getTime() <= windowEnd.getTime();

  // Jobs belonging to the window: applied in-window, or saved in-window
  const windowJobs = jobs.filter((job) => {
    const applied = appliedDate(job);
    if (applied && inWindow(applied)) return true;
    return !applied && job.createdAt >= windowStart && job.createdAt <= windowEnd;
  });

  // Fill series
  for (const job of jobs) {
    const applied = appliedDate(job);
    if (applied) {
      const b = bucketFor(buckets, applied);
      if (b) b.point.applied++;
    }
    if (job.responseReceived === "YES") {
      const responseDate = toDate(job.responseDate);
      const b = responseDate ? bucketFor(buckets, responseDate) : undefined;
      if (b) b.point.responses++;
    }
    for (const interview of job.interviews) {
      const date = interviewDate(interview);
      if (date) {
        const b = bucketFor(buckets, date);
        if (b) b.point.interviews++;
      }
    }
  }

  // Summary
  const appliedJobs = windowJobs.filter((j) => j.status !== "SAVED");
  const total = windowJobs.length;
  const responded = appliedJobs.filter((j) => j.responseReceived === "YES");
  const offers = windowJobs.filter((j) => j.status === "OFFER").length;
  const jobsWithInterviews = appliedJobs.filter((j) => j.interviews.length > 0);

  const responseDeltas = responded
    .map((j) => ({
      applied: toDate(j.dateApplied),
      responded: toDate(j.responseDate),
    }))
    .filter(
      (d): d is { applied: Date; responded: Date } =>
        d.applied !== null && d.responded !== null,
    )
    .map((d) => (d.responded.getTime() - d.applied.getTime()) / DAY_MS);
  const avgResponseDays =
    responseDeltas.length > 0
      ? Math.round(
          (responseDeltas.reduce((sum, d) => sum + d, 0) /
            responseDeltas.length) *
            10,
        ) / 10
      : null;

  // Pace — computed on all-time applied dates
  const appliedKeys = new Set<string>();
  const appliedCounts = new Map<string, number>();
  for (const job of jobs) {
    const applied = appliedDate(job);
    if (applied) {
      const key = dayKey(applied);
      appliedKeys.add(key);
      appliedCounts.set(key, (appliedCounts.get(key) ?? 0) + 1);
    }
  }
  const today = now.getTime();
  const withinLastDays = (days: number) =>
    jobs.filter((job) => {
      const applied = appliedDate(job);
      if (!applied) return false;
      const t = applied.getTime();
      return t >= today - (days - 1) * DAY_MS && t <= today;
    }).length;
  const thisWeek = withinLastDays(7);
  const lastWeek = withinLastDays(14) - thisWeek;

  let currentStreak = 0;
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(addDays(now, -1));
  if (appliedKeys.has(todayKey) || appliedKeys.has(yesterdayKey)) {
    let cursor = appliedKeys.has(todayKey) ? now : addDays(now, -1);
    while (appliedKeys.has(dayKey(cursor))) {
      currentStreak++;
      cursor = addDays(cursor, -1);
    }
  }

  const sortedKeys = [...appliedKeys].sort();
  let longestStreak = 0;
  let run = 0;
  let prevTime: number | null = null;
  for (const key of sortedKeys) {
    const time = Date.parse(key + "T00:00:00Z");
    run = prevTime !== null && time - prevTime === DAY_MS ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prevTime = time;
  }

  const windowDays = Math.max(
    1,
    Math.ceil((windowEnd.getTime() - windowStart.getTime()) / DAY_MS),
  );
  const windowAppliedCount = windowJobs.filter((j) => appliedDate(j)).length;
  const prevPeriodApplied =
    range === "all"
      ? null
      : jobs.filter((job) => {
          const applied = appliedDate(job);
          if (!applied) return false;
          const t = applied.getTime();
          return (
            t >= windowStart.getTime() - windowDays * DAY_MS &&
            t < windowStart.getTime()
          );
        }).length;

  // Breakdowns
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  const responseRateBySource: Record<
    string,
    { total: number; responded: number; rate: number }
  > = {};
  for (const job of windowJobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    bySource[job.source] = (bySource[job.source] ?? 0) + 1;
    byMethod[job.applicationMethod] = (byMethod[job.applicationMethod] ?? 0) + 1;

    const entry = (responseRateBySource[job.source] ??= {
      total: 0,
      responded: 0,
      rate: 0,
    });
    entry.total++;
    if (job.responseReceived === "YES") entry.responded++;
  }
  for (const entry of Object.values(responseRateBySource)) {
    entry.rate = pct(entry.responded, entry.total);
  }

  // Upcoming interviews (across all jobs, not just the window)
  const upcomingInterviews = jobs
    .flatMap((job) =>
      job.interviews
        .filter((i) => i.scheduledAt && i.scheduledAt.getTime() >= today)
        .map((i) => ({
          id: i.id,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          type: i.interviewType,
          roundNumber: i.roundNumber,
          scheduledAt: i.scheduledAt!.toISOString(),
        })),
    )
    .sort(
      (a, b) =>
        Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt),
    )
    .slice(0, 5);

  return {
    range,
    bucket,
    series: buckets.map((b) => b.point),
    summary: {
      total,
      applied: appliedJobs.length,
      saved: byStatus.SAVED ?? 0,
      responseRate: pct(responded.length, appliedJobs.length),
      interviewRate: pct(jobsWithInterviews.length, appliedJobs.length),
      offerRate: pct(offers, appliedJobs.length),
      responded: responded.length,
      noResponse: appliedJobs.filter((j) => j.responseReceived === "NO").length,
      pending: appliedJobs.filter((j) => j.responseReceived === "PENDING").length,
      offers,
      rejections: windowJobs.filter((j) => j.status === "REJECTED").length,
      totalInterviews: windowJobs.reduce(
        (sum, j) => sum + j.interviews.length,
        0,
      ),
      jobsWithInterviews: jobsWithInterviews.length,
      avgResponseDays,
    },
    pace: {
      thisWeek,
      lastWeek,
      avgPerDay: Math.round((windowAppliedCount / windowDays) * 100) / 100,
      avgPerWeek: Math.round((windowAppliedCount / (windowDays / 7)) * 10) / 10,
      activeDays: new Set(
        windowJobs
          .map(appliedDate)
          .filter((d): d is Date => d !== null)
          .map(dayKey),
      ).size,
      currentStreak,
      longestStreak,
      prevPeriodApplied,
    },
    funnel: {
      applied: appliedJobs.length,
      responded: responded.length,
      interviewed: jobsWithInterviews.length,
      offers,
    },
    heatmap: buildHeatmap(appliedCounts, now),
    byStatus,
    bySource,
    byMethod,
    responseRateBySource,
    upcomingInterviews,
  };
}

/** Parse a range query param, tolerating legacy values. */
export function parseStatsRange(value: string | null): StatsRange {
  switch (value) {
    case "7d":
      return "7d";
    case "30d":
      return "30d";
    case "week":
    case "90d":
      return "90d";
    case "6m":
      return "6m";
    case "1y":
    case "year":
    case "month":
      return "1y";
    case "all":
      return "all";
    default:
      return "1y";
  }
}
