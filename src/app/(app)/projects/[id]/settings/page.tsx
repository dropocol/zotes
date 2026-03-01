"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { ProjectSettingsClient } from "./page-client";
import type { Project } from "@/types/project";
import type { Collaborator, CollaboratorsData } from "@/types/project";

interface ProjectWithRole extends Project {
  userRole: string;
  isOwner: boolean;
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<ProjectWithRole | null>(null);
  const [collaboratorsData, setCollaboratorsData] = useState<CollaboratorsData | null>(null);
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

        // Fetch collaborators
        const collabResponse = await fetch(
          `/api/projects/${resolvedParams.id}/collaborators`
        );
        if (collabResponse.ok) {
          const collabData = await collabResponse.json();
          setCollaboratorsData(collabData);
        }
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
      }

      // Refresh collaborators
      const collabResponse = await fetch(
        `/api/projects/${resolvedParams.id}/collaborators`
      );
      if (collabResponse.ok) {
        const collabData = await collabResponse.json();
        setCollaboratorsData(collabData);
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

  // Only owners can access settings
  if (!project.isOwner) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Projects", href: "/projects" },
          { title: project.name, href: `/projects/${project.id}` },
          { title: "Settings" },
        ]}
      >
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Access denied</h2>
          <p className="text-muted-foreground mt-1">
            Only project owners can access project settings.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${project.id}`}>Go back to project</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProjectSettingsClient
      project={project}
      collaboratorsData={collaboratorsData}
      onRefresh={handleRefresh}
    />
  );
}
