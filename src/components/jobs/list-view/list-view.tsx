"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  Building2,
  MapPin,
  MessageSquare,
  DollarSign,
  Clock,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import { useJobs } from "../job-context";
import { BulkActionBar } from "./bulk-action-bar";
import {
  JOB_SOURCES,
  JOB_APPLICATION_STATUSES,
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
  getStatusDisplayName,
  formatSalary,
  getResponseStatusColor,
} from "@/types/jobs";
import { usePagination } from "@/hooks/use-pagination";
import type { JobApplication, JobInterview, ResponseStatus } from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface PaginatedJobsResponse {
  data: JobWithInterviews[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ListViewProps {
  onJobClick: (job: JobWithInterviews) => void;
  refreshKey?: number;
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

export function ListView({ onJobClick, refreshKey = 0 }: ListViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { handleBulkUpdate } = useJobs();

  // Multi-select state for bulk updates
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Track if component has mounted (to avoid URL sync during SSR/hydration)
  const mountedRef = React.useRef(false);

  // Read URL values during render (derived state)
  const urlSearch = searchParams.get("search") || ""
  const urlStatus = searchParams.get("status") || "all"
  const urlSource = searchParams.get("source") || "all"

  // Internal state for user interactions (null means use URL value)
  const [jobs, setJobs] = React.useState<JobWithInterviews[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = React.useState<string | null>(null);
  const [internalStatus, setInternalStatus] = React.useState<string | null>(null);
  const [internalSource, setInternalSource] = React.useState<string | null>(null);

  // Use internal state if set, otherwise use URL values
  const search = searchInput ?? urlSearch
  const statusFilter = internalStatus ?? urlStatus
  const sourceFilter = internalSource ?? urlSource

  const pagination = usePagination({
    totalItems,
    initialLimit: 25,
  });

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build the target URL based on current state
  const buildTargetUrl = React.useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (sourceFilter !== "all") {
      params.set("source", sourceFilter);
    }
    if (pagination.currentPage > 1) {
      params.set("page", pagination.currentPage.toString());
    }
    if (pagination.limit !== 25) {
      params.set("limit", pagination.limit.toString());
    }

    return params.toString() ? `${pathname}?${params.toString()}` : pathname;
  }, [debouncedSearch, statusFilter, sourceFilter, pagination.currentPage, pagination.limit, pathname]);

  // Mark as mounted after first render
  React.useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Update URL only when it would actually change (and after mount)
  React.useEffect(() => {
    if (!mountedRef.current) return;

    const targetUrl = buildTargetUrl();
    const currentUrl = pathname + window.location.search;

    if (targetUrl !== currentUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [buildTargetUrl, router, pathname]);

  // Wrapper functions to set internal state
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleStatusChange = React.useCallback((value: string) => {
    setInternalStatus(value);
  }, []);

  const handleSourceChange = React.useCallback((value: string) => {
    setInternalSource(value);
  }, []);

  // Fetch jobs from API with filters
  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters to params
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (sourceFilter !== "all") {
        params.set("source", sourceFilter);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (response.ok) {
        const data: PaginatedJobsResponse = await response.json();
        setJobs(data.data);
        setTotalItems(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, debouncedSearch, statusFilter, sourceFilter]);

  // Fetch on mount and when filters/pagination/refreshKey changes
  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshKey]);

  // Reset to first page when filters change (but not on initial mount with URL params)
  const filtersChangedRef = React.useRef(false);

  React.useEffect(() => {
    // Skip on initial mount - we don't want to reset page when loading from URL
    if (!filtersChangedRef.current) {
      filtersChangedRef.current = true;
      return;
    }
    if (pagination.currentPage > 1) {
      pagination.setPage(1);
    }
  }, [debouncedSearch, statusFilter, sourceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Selection helpers (operate on rows rendered on the current page) ---
  const pageIds = React.useMemo(() => jobs.map((j) => j.id), [jobs]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleOne = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(() => {
    setSelectedIds((prev) => {
      // If everything on the page is selected, clear the page's ids;
      // otherwise select all of them.
      if (pageIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pageIds]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  async function handleBulkApply(data: Parameters<typeof handleBulkUpdate>[1]) {
    if (selectedIds.size === 0) return;
    try {
      await handleBulkUpdate(Array.from(selectedIds), data);
      clearSelection();
    } catch (error) {
      console.error("Error applying bulk update:", error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
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
          <Select value={sourceFilter} onValueChange={handleSourceChange}>
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
      {isLoading && jobs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all on page"
                      disabled={jobs.length === 0}
                    />
                  </TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Interviews</TableHead>
                  <TableHead>Found</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No job applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onJobClick(job)}
                      data-state={selectedIds.has(job.id) ? "selected" : undefined}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(job.id)}
                          onCheckedChange={() => toggleOne(job.id)}
                          aria-label={`Select ${job.jobTitle} at ${job.companyName}`}
                        />
                      </TableCell>
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
                        <span className="text-sm">{getApplicationMethodDisplayName(job.applicationMethod)}</span>
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

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            limit={pagination.limit}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
          />
        </>
      )}

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={clearSelection}
          onApply={handleBulkApply}
        />
      )}
    </div>
  );
}
