"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { JobStats } from "@/types/jobs";

const activityChartConfig = {
  applied: {
    label: "Applied",
    color: "var(--primary)",
  },
  responses: {
    label: "Responses",
    color: "var(--chart-2)",
  },
  interviews: {
    label: "Interviews",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/** Zounty-style bar chart (recharts + shadcn ChartContainer). Bare version —
 *  embeddable in another card, as on the dashboard. */
export function BarActivityChart({
  series,
  bucket,
  className,
}: {
  series: JobStats["series"];
  bucket: JobStats["bucket"];
  className?: string;
}) {
  const hasData = series.some(
    (d) => d.applied > 0 || d.responses > 0 || d.interviews > 0,
  );

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {hasData ? (
        <ChartContainer
          config={activityChartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) =>
                new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(`${value}T00:00:00Z`).toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" },
                    )
                  }
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="applied"
              fill="var(--color-applied)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="responses"
              fill="var(--color-responses)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="interviews"
              fill="var(--color-interviews)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          No applications in this period
        </div>
      )}
    </div>
  );
}

/** Full card version with header, as used on the stats page. */
export function ActivityChart({
  series,
  bucket,
}: {
  series: JobStats["series"];
  bucket: JobStats["bucket"];
}) {
  return (
    <div
      className="stat-fade-up overflow-hidden rounded-xl border bg-card"
      style={{ animationDelay: "120ms" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <div>
          <h3 className="font-medium">Application activity</h3>
          <p className="text-xs text-muted-foreground">
            Per {bucket}, with replies &amp; interviews
          </p>
        </div>
      </div>
      <div className="p-4 md:p-5">
        <BarActivityChart series={series} bucket={bucket} />
      </div>
    </div>
  );
}
