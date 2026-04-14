"use client";

import * as React from "react";
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Link2,
  Mail,
  Globe,
  Building2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface JobStats {
  range: string;
  summary: {
    total: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    respondedYes: number;
    respondedNo: number;
    pending: number;
    totalInterviews: number;
    jobsWithInterviews: number;
  };
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byMethod: Record<string, number>;
  applicationsOverTime: Record<string, number>;
  responseRateBySource: Record<string, { total: number; responded: number; rate: number }>;
}

interface StatsViewProps {
  stats: JobStats | null;
}

const sourceIcons: Record<string, React.ReactNode> = {
  linkedin: <Link2 className="size-4 text-blue-600" />,
  slack: <Mail className="size-4 text-purple-600" />,
  facebook: <Globe className="size-4 text-blue-500" />,
  x: <Globe className="size-4 text-slate-800" />,
  companyWebsite: <Building2 className="size-4 text-emerald-600" />,
  referral: <Users className="size-4 text-amber-600" />,
  jobBoard: <Briefcase className="size-4 text-indigo-600" />,
  other: <Globe className="size-4 text-slate-500" />,
};

const sourceColors: Record<string, string> = {
  linkedin: "bg-blue-500",
  slack: "bg-purple-500",
  facebook: "bg-blue-400",
  x: "bg-slate-700",
  companyWebsite: "bg-emerald-500",
  referral: "bg-amber-500",
  jobBoard: "bg-indigo-500",
  other: "bg-slate-400",
};

const statusColors: Record<string, string> = {
  saved: "bg-slate-400",
  applied: "bg-blue-500",
  phoneScreen: "bg-purple-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-500",
  withdrawn: "bg-slate-500",
  noResponse: "bg-slate-300",
};

export function StatsView({ stats }: StatsViewProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const { summary, byStatus, bySource, responseRateBySource } = stats;

  // Calculate status breakdown for chart
  const statusEntries = Object.entries(byStatus).filter(([_, count]) => count > 0);
  const totalForStatus = statusEntries.reduce((sum, [_, count]) => sum + count, 0);

  // Sort sources by count
  const sourceEntries = Object.entries(bySource)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalSources = sourceEntries.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid - Dashboard Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Applications */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Applications</span>
            <Briefcase className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold mt-1">{summary.total}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>

        {/* Response Rate */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Rate</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-semibold mt-1">{summary.responseRate}%</p>
          <div className="mt-2">
            <Progress value={summary.responseRate} className="h-1.5" />
          </div>
        </div>

        {/* Interview Rate */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Interview Rate</span>
            <Users className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold mt-1">{summary.interviewRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.jobsWithInterviews} of {summary.total} jobs
          </p>
        </div>

        {/* Offer Rate */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Offer Rate</span>
            <CheckCircle2 className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold mt-1">{summary.offerRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {byStatus.offer || 0} offers received
          </p>
        </div>
      </div>

      {/* Response Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-emerald-500/5 border-emerald-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{summary.respondedYes}</p>
              <p className="text-sm text-muted-foreground">Positive Responses</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-red-500/5 border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{summary.respondedNo}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-amber-500/5 border-amber-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{summary.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-medium">Applications by Status</h3>
          </div>
          <div className="p-4">
            {statusEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => {
                  const percentage = Math.round((count / totalForStatus) * 100);
                  const displayName = status === 'saved' ? 'Saved' :
                    status === 'applied' ? 'Applied' :
                    status === 'phoneScreen' ? 'Phone Screen' :
                    status === 'interview' ? 'Interview' :
                    status === 'offer' ? 'Offer' :
                    status === 'rejected' ? 'Rejected' :
                    status === 'withdrawn' ? 'Withdrawn' :
                    status === 'noResponse' ? 'No Response' : status;

                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-slate-400'}`} />
                          <span>{displayName}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Applications by Source */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-medium">Applications by Source</h3>
          </div>
          <div className="p-4">
            {sourceEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {sourceEntries.map(([source, count]) => {
                  const percentage = Math.round((count / totalSources) * 100);
                  const displayName = source === 'linkedin' ? 'LinkedIn' :
                    source === 'slack' ? 'Slack' :
                    source === 'facebook' ? 'Facebook' :
                    source === 'x' ? 'X (Twitter)' :
                    source === 'companyWebsite' ? 'Company Website' :
                    source === 'referral' ? 'Referral' :
                    source === 'jobBoard' ? 'Job Board' : 'Other';

                  return (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sourceIcons[source] || <Globe className="size-4 text-slate-500" />}
                        <span className="text-sm">{displayName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sourceColors[source] || 'bg-slate-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Rate by Source */}
      {Object.keys(responseRateBySource).length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-medium">Response Rate by Source</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(responseRateBySource).map(([source, data]) => {
                const displayName = source === 'LINKEDIN' ? 'LinkedIn' :
                  source === 'SLACK' ? 'Slack' :
                  source === 'FACEBOOK' ? 'Facebook' :
                  source === 'X' ? 'X (Twitter)' :
                  source === 'COMPANY_WEBSITE' ? 'Company Website' :
                  source === 'REFERRAL' ? 'Referral' :
                  source === 'JOB_BOARD' ? 'Job Board' : 'Other';

                return (
                  <div key={source} className="p-3 rounded-lg border bg-muted/30">
                    <div className="text-sm font-medium mb-1">{displayName}</div>
                    <div className="text-2xl font-semibold">{data.rate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {data.responded} of {data.total} responded
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
