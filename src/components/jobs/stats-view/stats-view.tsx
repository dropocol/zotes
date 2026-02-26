"use client";

import * as React from "react";
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getJobSourceDisplayName, getStatusDisplayName } from "@/types/jobs";

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
  onRangeChange: (range: string) => void;
  range: string;
}

export function StatsView({ stats, onRangeChange, range }: StatsViewProps) {
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

  return (
    <div className="space-y-6">
      {/* Range Selector */}
      <div className="flex justify-end">
        <Select value={range} onValueChange={onRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.responseRate}%</div>
            <Progress value={summary.responseRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Users className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.interviewRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.jobsWithInterviews} of {summary.total} jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
            <TrendingUp className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.offerRate}%</div>
            <p className="text-xs text-muted-foreground">
              {byStatus.offer || 0} offers received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => {
                  const percentage = Math.round((count / totalForStatus) * 100);
                  // Map status keys to display names
                  const statusKey = status as keyof typeof byStatus;
                  const displayName = statusKey === 'saved' ? 'Saved' :
                    statusKey === 'applied' ? 'Applied' :
                    statusKey === 'phoneScreen' ? 'Phone Screen' :
                    statusKey === 'interview' ? 'Interview' :
                    statusKey === 'offer' ? 'Offer' :
                    statusKey === 'rejected' ? 'Rejected' :
                    statusKey === 'withdrawn' ? 'Withdrawn' :
                    statusKey === 'noResponse' ? 'No Response' : status;

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{displayName}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {sourceEntries.map(([source, count]) => {
                  const sourceKey = source.toUpperCase().replace(/_/g, '_') as
                    'LINKEDIN' | 'SLACK' | 'FACEBOOK' | 'X' | 'COMPANY_WEBSITE' | 'REFERRAL' | 'JOB_BOARD' | 'OTHER';
                  const total = sourceEntries.reduce((sum, [_, c]) => sum + c, 0);
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm">
                        {sourceKey === 'LINKEDIN' ? 'LinkedIn' :
                         sourceKey === 'SLACK' ? 'Slack' :
                         sourceKey === 'FACEBOOK' ? 'Facebook' :
                         sourceKey === 'X' ? 'X (Twitter)' :
                         sourceKey === 'COMPANY_WEBSITE' ? 'Company Website' :
                         sourceKey === 'REFERRAL' ? 'Referral' :
                         sourceKey === 'JOB_BOARD' ? 'Job Board' : 'Other'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Rate by Source */}
      {Object.keys(responseRateBySource).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response Rate by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(responseRateBySource).map(([source, data]) => {
                const sourceKey = source as 'LINKEDIN' | 'SLACK' | 'FACEBOOK' | 'X' | 'COMPANY_WEBSITE' | 'REFERRAL' | 'JOB_BOARD' | 'OTHER';
                return (
                  <div key={source} className="p-3 rounded-lg border bg-muted/30">
                    <div className="text-sm font-medium mb-1">
                      {sourceKey === 'LINKEDIN' ? 'LinkedIn' :
                       sourceKey === 'SLACK' ? 'Slack' :
                       sourceKey === 'FACEBOOK' ? 'Facebook' :
                       sourceKey === 'X' ? 'X (Twitter)' :
                       sourceKey === 'COMPANY_WEBSITE' ? 'Company Website' :
                       sourceKey === 'REFERRAL' ? 'Referral' :
                       sourceKey === 'JOB_BOARD' ? 'Job Board' : 'Other'}
                    </div>
                    <div className="text-2xl font-bold">{data.rate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {data.responded} of {data.total} responded
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{summary.respondedYes}</div>
                <div className="text-sm text-muted-foreground">Responded Yes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
              <XCircle className="size-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{summary.respondedNo}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
              <Clock className="size-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{summary.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
