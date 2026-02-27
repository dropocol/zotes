"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Building2,
  MapPin,
  Calendar,
  GripVertical,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import { KANBAN_COLUMNS, formatSalary } from "@/types/jobs";
import type {
  JobApplication,
  JobInterview,
  JobApplicationStatus,
} from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface KanbanViewProps {
  jobs: JobWithInterviews[];
  onJobClick: (job: JobWithInterviews) => void;
  onStatusChange: (jobId: string, newStatus: JobApplicationStatus) => void;
}

export function KanbanView({
  jobs,
  onJobClick,
  onStatusChange,
}: KanbanViewProps) {
  // Group jobs by column
  const jobsByColumn = React.useMemo(() => {
    const grouped: Record<string, JobWithInterviews[]> = {};

    KANBAN_COLUMNS.forEach((column) => {
      grouped[column.id] = jobs.filter((job) =>
        column.statuses.includes(job.status),
      );
    });

    return grouped;
  }, [jobs]);

  const handleDragStart = (e: React.DragEvent, job: JobWithInterviews) => {
    e.dataTransfer.setData("jobId", job.id);
    e.dataTransfer.setData("currentStatus", job.status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    columnStatuses: JobApplicationStatus[],
  ) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const newStatus = columnStatuses[0]; // Use the first status of the column
    onStatusChange(jobId, newStatus);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex-1 min-w-[280px] max-w-[400px] flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.statuses)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="font-normal h-5 px-1.5">
                {jobsByColumn[column.id]?.length || 0}
              </Badge>
            </div>
          </div>

          {/* Column Content */}
          <div
            className="flex-1 space-y-2 bg-muted/30 rounded-lg p-2 overflow-y-auto"
            style={{ minHeight: "calc(100vh - 280px)" }}
          >
            {jobsByColumn[column.id]?.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md hover:border-border/80 transition-all duration-200 border-border/50 bg-card py-2"
                draggable
                onDragStart={(e) => handleDragStart(e, job)}
                onClick={() => onJobClick(job)}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Header: Drag handle + Job Title */}
                  <div className="flex items-start gap-2">
                    <GripVertical className="size-4 text-muted-foreground/50 mt-0.5 flex-shrink-0 cursor-grab hover:text-muted-foreground transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight line-clamp-2">
                        {job.jobTitle}
                      </div>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                    <Building2 className="size-3 flex-shrink-0" />
                    <span className="truncate">{job.companyName}</span>
                  </div>

                  {/* Status and Source */}
                  <div className="flex items-center gap-2 pl-6 flex-wrap">
                    <StatusBadge status={job.status} />
                    <SourceIcon source={job.source} />
                  </div>

                  {/* Location and Salary Row */}
                  <div className="flex items-center gap-3 pl-6 flex-wrap">
                    {(job.location || job.isRemote) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        <span className="truncate max-w-[100px]">
                          {job.isRemote ? "Remote" : job.location}
                        </span>
                      </div>
                    )}
                    {formatSalary(
                      job.salaryMin,
                      job.salaryMax,
                      job.salaryCurrency || undefined,
                    ) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="size-3" />
                        <span className="truncate">
                          {formatSalary(
                            job.salaryMin,
                            job.salaryMax,
                            job.salaryCurrency || undefined,
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Date and Interviews */}
                  <div className="flex items-center justify-between pl-6 pt-1 border-t border-border/30 mt-2 pt-2">
                    {job.dateApplied ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {format(new Date(job.dateApplied), "MMM d")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
                        <Calendar className="size-3" />
                        Not applied
                      </div>
                    )}
                    {job.interviews.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs h-5 px-1.5 gap-1"
                      >
                        <MessageSquare className="size-2.5" />
                        {job.interviews.length}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {jobsByColumn[column.id]?.length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground/50 border-2 border-dashed border-border/30 rounded-lg">
                Drop here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
