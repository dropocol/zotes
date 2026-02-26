"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { ProjectsTable } from "@/components/projects/projects-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectForm } from "@/components/projects/project-form";
import { Loader2, Plus, Search, Layers } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }

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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          searchQuery={searchQuery}
          onRefresh={fetchProjects}
        />
      )}

      <ProjectForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </DashboardLayout>
  );
}
