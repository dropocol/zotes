"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { ProjectsTable } from "@/components/projects/projects-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ProjectForm } from "@/components/projects/project-form";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Plus, Search, Layers } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { ProjectWithRole, PaginatedProjectsResponse } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const pagination = usePagination({
    totalItems,
    initialLimit: 10,
  });

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const data: PaginatedProjectsResponse = await response.json();
        setProjects(Array.isArray(data.data) ? data.data : []);
        setTotalItems(data.pagination.total);
      } else {
        setProjects([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handlePageChange = (page: number) => {
    pagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    pagination.setLimit(limit);
  };

  return (
    <DashboardLayout breadcrumbs={[{ title: "Projects", href: "/projects" }]}>
      <PageHeader
        title="Projects"
        description="Organize your work into projects"
        icon={Layers}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <ProjectsTable
            projects={projects}
            searchQuery={searchQuery}
            onRefresh={fetchProjects}
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

      <ProjectForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchProjects}
      />
    </DashboardLayout>
  );
}
