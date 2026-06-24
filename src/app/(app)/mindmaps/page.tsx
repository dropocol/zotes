"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { MindMapsTable } from "@/components/mindmaps/mindmaps-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Plus, Search, Network } from "lucide-react";
import Link from "next/link";
import { usePagination } from "@/hooks/use-pagination";
import { MindMap, PaginatedMindMapsResponse } from "@/types";

export default function MindMapsPage() {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const pagination = usePagination({
    totalItems,
    initialLimit: 10,
  });

  const fetchMindMaps = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        personalOnly: "true",
      });
      const response = await fetch(`/api/mindmaps?${params.toString()}`);
      const data: PaginatedMindMapsResponse = await response.json();
      setMindMaps(data.data);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error("Error fetching mindmaps:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchMindMaps();
  }, [fetchMindMaps]);

  const handlePageChange = (page: number) => {
    pagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    pagination.setLimit(limit);
  };

  return (
    <DashboardLayout breadcrumbs={[{ title: "Mind Maps", href: "/mindmaps" }]}>
      <PageHeader
        title="Mind Maps"
        description="Map out ideas and mental models"
        icon={Network}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mind maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Button asChild>
          <Link href="/mindmaps/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Mind Map
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <MindMapsTable
            mindMaps={mindMaps}
            searchQuery={searchQuery}
            onRefresh={fetchMindMaps}
            showProjectColumn={false}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </DashboardLayout>
  );
}
