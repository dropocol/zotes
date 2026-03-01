"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Settings, Loader2, Save } from "lucide-react";
import { CollaboratorsList } from "@/components/projects/collaborators-list";
import type { Project, Collaborator, CollaboratorsData } from "@/types/project";

interface ProjectWithRole extends Project {
  userRole: string;
  isOwner: boolean;
}

interface ProjectSettingsClientProps {
  project: ProjectWithRole;
  collaboratorsData: CollaboratorsData | null;
  onRefresh: () => void;
}

const COLOR_PRESETS = [
  "#f97316", // orange
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#84cc16", // lime
];

export function ProjectSettingsClient({
  project,
  collaboratorsData,
  onRefresh,
}: ProjectSettingsClientProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [color, setColor] = useState(project.color || "#f97316");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    name !== project.name ||
    description !== (project.description || "") ||
    color !== (project.color || "#f97316");

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Projects", href: "/projects" },
        { title: project.name, href: `/projects/${project.id}` },
        { title: "Settings" },
      ]}
    >
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${project.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
          </div>
        </div>

        {/* General Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">General</h2>

          <div className="rounded-lg border p-6 space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`h-6 w-6 rounded-full transition-all ${
                      color === presetColor
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer h-6 w-6"
                  />
                  <div
                    className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </section>

        <Separator className="my-8" />

        {/* People Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">People</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage who has access to this project
          </p>

          {collaboratorsData && (
            <div className="rounded-lg border p-4">
              <CollaboratorsList
                projectId={project.id}
                owner={collaboratorsData.owner}
                collaborators={collaboratorsData.collaborators}
                isOwner={project.isOwner}
                onRefresh={onRefresh}
              />
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
