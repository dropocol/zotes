"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  MapPin,
  MessageSquare,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import {
  JOB_SOURCES,
  JOB_APPLICATION_STATUSES,
  getJobSourceDisplayName,
  getStatusDisplayName,
  formatSalary,
  getResponseStatusColor,
} from "@/types/jobs";
import type { JobApplication, JobInterview, ResponseStatus } from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface ListViewProps {
  jobs: JobWithInterviews[];
  onJobClick: (job: JobWithInterviews) => void;
}

// Response Badge Component
function ResponseBadge({ response }: { response: ResponseStatus }) {
  const colors = getResponseStatusColor(response);
  const labels: Record<ResponseStatus, string> = {
    YES: "Yes",
    NO: "No",
    PENDING: "Pending",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {labels[response]}
    </span>
  );
}

type SortField = "createdAt" | "dateApplied" | "dateFound" | "companyName" | "jobTitle" | "status" | "responseReceived";
type SortDirection = "asc" | "desc";

export function ListView({ jobs, onJobClick }: ListViewProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [sortField, setSortField] = React.useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  // Filter jobs
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search === "" ||
        job.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        job.companyName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;

      const matchesSource =
        sourceFilter === "all" || job.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [jobs, search, statusFilter, sourceFilter]);

  // Sort jobs
  const sortedJobs = React.useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "dateApplied":
          const dateAppliedA = a.dateApplied ? new Date(a.dateApplied).getTime() : 0;
          const dateAppliedB = b.dateApplied ? new Date(b.dateApplied).getTime() : 0;
          comparison = dateAppliedA - dateAppliedB;
          break;
        case "dateFound":
          const dateFoundA = a.dateFound ? new Date(a.dateFound).getTime() : 0;
          const dateFoundB = b.dateFound ? new Date(b.dateFound).getTime() : 0;
          comparison = dateFoundA - dateFoundB;
          break;
        case "companyName":
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case "jobTitle":
          comparison = a.jobTitle.localeCompare(b.jobTitle);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "responseReceived":
          comparison = a.responseReceived.localeCompare(b.responseReceived);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredJobs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="size-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {JOB_APPLICATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusDisplayName(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {JOB_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {getJobSourceDisplayName(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => handleSort("jobTitle")}
                >
                  Job Title
                  <ArrowUpDown className="ml-2 size-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => handleSort("companyName")}
                >
                  Company
                  <ArrowUpDown className="ml-2 size-4" />
                </Button>
              </TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Interviews</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => handleSort("dateFound")}
                >
                  Found
                  <ArrowUpDown className="ml-2 size-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => handleSort("dateApplied")}
                >
                  Applied
                  <ArrowUpDown className="ml-2 size-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => handleSort("createdAt")}
                >
                  Created
                  <ArrowUpDown className="ml-2 size-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No job applications found
                </TableCell>
              </TableRow>
            ) : (
              sortedJobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onJobClick(job)}
                >
                  <TableCell>
                    <div className="font-medium">{job.jobTitle}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      {job.companyName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SourceIcon source={job.source} showLabel />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <ResponseBadge response={job.responseReceived} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.location && (
                        <>
                          <MapPin className="size-4 text-muted-foreground" />
                          <span className="text-sm">{job.location}</span>
                        </>
                      )}
                      {job.isRemote && !job.location && (
                        <Badge variant="secondary">Remote</Badge>
                      )}
                      {job.isRemote && job.location && (
                        <Badge variant="secondary" className="ml-1">Remote</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined) ? (
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="size-3 text-muted-foreground" />
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.interviews.length > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <MessageSquare className="size-3" />
                        {job.interviews.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.dateFound
                      ? format(new Date(job.dateFound), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.dateApplied
                      ? format(new Date(job.dateApplied), "MMM d, yyyy")
                      : <span className="text-muted-foreground/50">Not applied</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {format(new Date(job.createdAt), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedJobs.length} of {jobs.length} applications
      </div>
    </div>
  );
}
