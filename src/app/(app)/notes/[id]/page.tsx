"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Loader2, Save, Trash2, Check } from "lucide-react";
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
import { Toolbar } from "@/components/editor/toolbar";
import type { Editor } from "@tiptap/react";

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
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editor, setEditor] = useState<Editor | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNote();
    fetchProjects();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== (note.content || "");
      const projectChanged =
        (selectedProject === "none" ? null : selectedProject) !==
        note.projectId;
      const hasChangesValue = titleChanged || contentChanged || projectChanged;
      setHasChanges(hasChangesValue);

      // Reset saved status when changes occur
      if (hasChangesValue && autoSaveStatus === "saved") {
        setAutoSaveStatus("idle");
      }
    }
  }, [title, content, selectedProject, note, autoSaveStatus]);

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

  const performAutoSave = useCallback(async () => {
    if (!title.trim() || !hasChanges) return;

    setAutoSaveStatus("saving");
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
        setAutoSaveStatus("saved");

        // Reset saved status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Error auto-saving note:", error);
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [id, title, content, selectedProject, hasChanges]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasChanges || !title.trim()) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, selectedProject, hasChanges, performAutoSave]);

  async function handleSave() {
    if (!title.trim()) return;

    // Clear auto-save timeout if manual save is triggered
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

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
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
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

  const handleEditorReady = useCallback((editorInstance: Editor | null) => {
    setEditor(editorInstance);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!note) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Note not found</h2>
          <Button asChild className="mt-4">
            <Link href="/notes">Go back to notes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const headerContent = (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Untitled"
      className="text-sm font-medium border-0 shadow-none focus-visible:ring-0 p-2 h-9 flex-1 min-w-0 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md"
    />
  );

  const headerActions = (
    <>
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
      {hasChanges && autoSaveStatus === "idle" && (
        <Badge variant="outline" className="text-muted-foreground">
          Unsaved changes
        </Badge>
      )}
      <Select value={selectedProject} onValueChange={setSelectedProject}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
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
      {note.pinned && <Badge variant="secondary">Pinned</Badge>}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive bg-red-50 h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button onClick={handleSave} disabled={!title.trim() || isSaving} size="sm" className="h-8">
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save
      </Button>
    </>
  );

  return (
    <DashboardLayout
      headerContent={headerContent}
      headerActions={headerActions}
      fullHeight
    >
      <Toolbar editor={editor} />
      <TiptapEditor
        content={content}
        onChange={setContent}
        className="flex-1"
        hideToolbar
        onEditorReady={handleEditorReady}
      />
    </DashboardLayout>
  );
}
