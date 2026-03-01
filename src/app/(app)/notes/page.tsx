"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { NotesTable } from "@/components/notes/notes-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Plus, Search, StickyNote } from "lucide-react";
import Link from "next/link";
import { usePagination } from "@/hooks/use-pagination";
import { Note, PaginatedNotesResponse } from "@/types";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const pagination = usePagination({
    totalItems,
    initialLimit: 10,
  });

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await fetch(`/api/notes?${params.toString()}`);
      const data: PaginatedNotesResponse = await response.json();
      setNotes(data.data);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handlePageChange = (page: number) => {
    pagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    pagination.setLimit(limit);
  };

  return (
    <DashboardLayout breadcrumbs={[{ title: "Notes", href: "/notes" }]}>
      <PageHeader
        title="Notes"
        description="All your notes in one place"
        icon={StickyNote}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Note
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <NotesTable
            notes={notes}
            searchQuery={searchQuery}
            onRefresh={fetchNotes}
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
