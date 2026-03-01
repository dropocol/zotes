"use client";

import { useEffect, useState } from "react";
import { ProjectPageClient } from "./page-client";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Note, TodoList } from "@/types";
import type { Project } from "@/types/project";

interface ProjectWithRole extends Project {
  userRole: string;
  isOwner: boolean;
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<ProjectWithRole | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/projects/${resolvedParams.id}`);

        if (!response.ok) {
          setError(true);
          return;
        }

        const data = await response.json();
        setProject(data);
        setNotes(data.notes || []);
        setTodoLists(data.todoLists || []);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params]);

  const handleRefresh = async () => {
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/projects/${resolvedParams.id}`);

      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setNotes(data.notes || []);
        setTodoLists(data.todoLists || []);
      }
    } catch (err) {
      console.error("Error refreshing project:", err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Projects", href: "/projects" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Projects", href: "/projects" }]}>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Project not found</h2>
          <p className="text-muted-foreground mt-1">
            This project doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects">Go back to projects</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProjectPageClient
      project={project}
      notes={notes}
      todoLists={todoLists}
      onRefresh={handleRefresh}
    />
  );
}
