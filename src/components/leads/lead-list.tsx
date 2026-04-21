"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  Building2,
  Mail,
  Phone,
  Clock,
  Loader2,
  Users,
  MessageSquare,
  Calendar,
  Link2,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadTypeBadge } from "./lead-type-badge";
import {
  LEAD_STATUSES,
  getLeadStatusDisplayName,
} from "@/types/leads";
import { usePagination } from "@/hooks/use-pagination";
import { useLeads } from "./lead-context";
import type { Lead } from "@prisma/client";

interface PaginatedLeadsResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface LeadStats {
  total: number;
  newLeads: number;
  reachedOut: number;
  inConversation: number;
  meetingScheduled: number;
}

interface LeadListProps {
  stats?: LeadStats;
}

export function LeadList({ stats }: LeadListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { handleLeadClick, refreshKey } = useLeads();

  // Track mount
  const mountedRef = React.useRef(false);

  // Read URL values
  const urlSearch = searchParams.get("search") || "";
  const urlStatus = searchParams.get("status") || "all";

  // Internal state
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = React.useState<string | null>(null);
  const [internalStatus, setInternalStatus] = React.useState<string | null>(null);

  // Use internal state if set, otherwise use URL values
  const search = searchInput ?? urlSearch;
  const statusFilter = internalStatus ?? urlStatus;

  const pagination = usePagination({
    totalItems,
    initialLimit: 25,
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build target URL
  const buildTargetUrl = React.useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (pagination.currentPage > 1) {
      params.set("page", pagination.currentPage.toString());
    }
    if (pagination.limit !== 25) {
      params.set("limit", pagination.limit.toString());
    }

    return params.toString() ? `${pathname}?${params.toString()}` : pathname;
  }, [debouncedSearch, statusFilter, pagination.currentPage, pagination.limit, pathname]);

  React.useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Update URL when state changes
  React.useEffect(() => {
    if (!mountedRef.current) return;

    const targetUrl = buildTargetUrl();
    const currentUrl = pathname + window.location.search;

    if (targetUrl !== currentUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [buildTargetUrl, router, pathname]);

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleStatusChange = React.useCallback((value: string) => {
    setInternalStatus(value);
  }, []);

  // Fetch leads
  const fetchLeads = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (response.ok) {
        const data: PaginatedLeadsResponse = await response.json();
        setLeads(data.data);
        setTotalItems(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  // Reset to first page when filters change
  const filtersChangedRef = React.useRef(false);

  React.useEffect(() => {
    if (!filtersChangedRef.current) {
      filtersChangedRef.current = true;
      return;
    }
    if (pagination.currentPage > 1) {
      pagination.setPage(1);
    }
  }, [debouncedSearch, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Stats Grid - Dashboard Style */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Contacts</span>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New</span>
              <Mail className="size-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.newLeads}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reached Out</span>
              <Link2 className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.reachedOut}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Conversation</span>
              <MessageSquare className="size-4 text-purple-500" />
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.inConversation}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Meeting Scheduled</span>
              <Calendar className="size-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.meetingScheduled}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="size-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {getLeadStatusDisplayName(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading && leads.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                      </TableCell>
                      <TableCell>
                        {lead.title ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="size-4 text-muted-foreground" />
                            <span className="text-sm">{lead.title}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.company ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground" />
                            {lead.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LeadTypeBadge type={lead.type} />
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="size-4 text-muted-foreground" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="size-4 text-muted-foreground" />
                            <span className="text-sm">{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(new Date(lead.createdAt), "MMM d, yyyy")}
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
    </div>
  );
}
