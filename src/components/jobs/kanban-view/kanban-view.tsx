"use client";

import * as React from "react";
import { format } from "date-fns";
import { Building2, MapPin, Calendar, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import { KANBAN_COLUMNS, formatSalary } from "@/types/jobs";
import type { JobApplication, JobInterview, JobApplicationStatus } from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface KanbanViewProps {
  jobs: JobWithInterviews[];
  onJobClick: (job: JobWithInterviews) => void;
  onStatusChange: (jobId: string, newStatus: JobApplicationStatus) => void;
}

export function KanbanView({ jobs, onJobClick, onStatusChange }: KanbanViewProps) {
  // Group jobs by column
  const jobsByColumn = React.useMemo(() => {
    const grouped: Record<string, JobWithInterviews[]> = {};

    KANBAN_COLUMNS.forEach((column) => {
      grouped[column.id] = jobs.filter((job) =>
        column.statuses.includes(job.status)
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
    columnStatuses: JobApplicationStatus[]
  ) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const newStatus = columnStatuses[0]; // Use the first status of the column
    onStatusChange(jobId, newStatus);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.statuses)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-medium text-sm">{column.title}</h3>
            <Badge variant="secondary" className="font-normal">
              {jobsByColumn[column.id]?.length || 0}
            </Badge>
          </div>

          {/* Column Content */}
          <div className="space-y-3 min-h-[200px] bg-muted/30 rounded-lg p-2">
            {jobsByColumn[column.id]?.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => handleDragStart(e, job)}
                onClick={() => onJobClick(job)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="size-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {job.jobTitle}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Building2 className="size-3" />
                        <span className="truncate">{job.companyName}</span>
                      </div>

                      {/* Source and Location */}
                      <div className="flex items-center gap-2 mt-2">
                        <SourceIcon source={job.source} />
                        {(job.location || job.isRemote) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span className="truncate">
                              {job.isRemote ? "Remote" : job.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Salary */}
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined)}
                        </div>
                      )}

                      {/* Date and Interviews */}
                      <div className="flex items-center justify-between mt-2">
                        {job.dateApplied && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {format(new Date(job.dateApplied), "MMM d")}
                          </div>
                        )}
                        {job.interviews.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {job.interviews.length} interview{job.interviews.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {jobsByColumn[column.id]?.length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                Drop here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
