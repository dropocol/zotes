"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Loader2, Save, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
}

// Default content with empty paragraphs for easier editing
const DEFAULT_CONTENT = "<p></p><p></p><p></p>";

export default function NewNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTitleRef = useRef(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Auto-save when content changes and title exists
  const performAutoSave = useCallback(async (titleValue: string, contentValue: string, projectValue: string) => {
    if (!titleValue.trim()) return;

    setAutoSaveStatus("saving");
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleValue.trim(),
          content: contentValue,
          projectId: projectValue === "none" ? null : projectValue,
        }),
      });

      if (response.ok) {
        const note = await response.json();
        setAutoSaveStatus("saved");
        // Redirect to the note page after auto-save
        router.push(`/notes/${note.id}`);
      }
    } catch (error) {
      console.error("Error auto-saving note:", error);
      setAutoSaveStatus("idle");
    }
  }, [router]);

  // Debounced auto-save effect
  useEffect(() => {
    hasTitleRef.current = title.trim().length > 0;

    if (!hasTitleRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasTitleRef.current) {
        performAutoSave(title, content, selectedProject);
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, selectedProject, performAutoSave]);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsFetchingProjects(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) return;

    // Clear auto-save timeout if manual save is triggered
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          projectId: selectedProject === "none" ? null : selectedProject,
        }),
      });

      if (response.ok) {
        const note = await response.json();
        router.push(`/notes/${note.id}`);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Notes", href: "/notes" },
        { title: "New Note" },
      ]}
    >
      <div className="max-w-[1200px] mx-auto w-full flex flex-col h-[calc(100vh-100px)]">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-3xl font-semibold border-0 shadow-none focus-visible:ring-0 p-0 h-12 flex-1"
          />
          {autoSaveStatus === "saving" && (
            <Badge variant="outline" className="text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}
          {autoSaveStatus === "saved" && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Check className="mr-1 h-3 w-3" />
              Saved
            </Badge>
          )}
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={!title.trim() || isLoading || autoSaveStatus === "saving"}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <TiptapEditor content={content} onChange={setContent} className="h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
