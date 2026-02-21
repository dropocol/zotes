"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  title: string;
  content?: string | null;
  pinned: boolean;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchNote();
    fetchProjects();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== (note.content || "");
      const projectChanged = (selectedProject === "none" ? null : selectedProject) !== note.projectId;
      setHasChanges(titleChanged || contentChanged || projectChanged);
    }
  }, [title, content, selectedProject, note]);

  async function fetchNote() {
    try {
      const response = await fetch(`/api/notes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data);
        setTitle(data.title);
        setContent(data.content || "");
        setSelectedProject(data.projectId || "none");
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  async function handleSave() {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PUT",
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
        const updatedNote = await response.json();
        setNote(updatedNote);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/notes");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Notes", href: "/notes" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!note) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Notes", href: "/notes" }]}>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Note not found</h2>
          <Button asChild className="mt-4">
            <Link href="/notes">Go back to notes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Notes", href: "/notes" },
        { title: note.title },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Edit Note</h1>
          </div>
          {note.pinned && (
            <Badge variant="secondary">Pinned</Badge>
          )}
          {hasChanges && (
            <Badge variant="outline" className="text-muted-foreground">Unsaved changes</Badge>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 border-b space-y-4">
            <div className="space-y-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="text-2xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-sm">Project:</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[200px] h-8">
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
              </div>
            </div>
          </div>
          <div className="prose-container">
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
