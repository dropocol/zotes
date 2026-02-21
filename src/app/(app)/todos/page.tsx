"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, ListTodo, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
interface Project {
  id: string;
  name: string;
  color?: string | null;
}

interface TodoList {
  id: string;
  name: string;
  description?: string | null;
  projectId?: string | null;
  project?: Project | null;
  updatedAt: string;
  _count: {
    items: number;
  };
}

export default function TodosPage() {
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("none");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [todoListsRes, projectsRes] = await Promise.all([
        fetch("/api/todo/lists"),
        fetch("/api/projects"),
      ]);

      if (todoListsRes.ok) {
        const data = await todoListsRes.json();
        setTodoLists(data);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/todo/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          projectId: newProjectId === "none" ? null : newProjectId,
        }),
      });

      if (response.ok) {
        setNewName("");
        setNewDescription("");
        setNewProjectId("none");
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating todo list:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this todo list?")) return;

    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting todo list:", error);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getTodoListUrl(todoList: TodoList) {
    if (todoList.projectId && todoList.project) {
      return `/projects/${todoList.projectId}/todos/${todoList.id}`;
    }
    return `/todos/${todoList.id}`;
  }

  return (
    <DashboardLayout breadcrumbs={[{ title: "Todos", href: "/todos" }]}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todo Lists</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and to-do lists
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              New Todo List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Todo List</DialogTitle>
              <DialogDescription>
                Create a new todo list to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter todo list name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project (optional)</Label>
                <Select value={newProjectId} onValueChange={setNewProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color || "#6b7280" }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : todoLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <ListTodo className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No todo lists yet
            </p>
            <p className="text-xs text-muted-foreground">
              Create your first todo list to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-center">Tasks</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todoLists.map((todoList) => (
                <TableRow key={todoList.id} className="group">
                  <TableCell>
                    <Link
                      href={getTodoListUrl(todoList)}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {todoList.name}
                    </Link>
                    {todoList.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {todoList.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {todoList.project ? (
                      <Link
                        href={`/projects/${todoList.project.id}`}
                        className="inline-flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: todoList.project.color || "#6b7280",
                          }}
                        />
                        {todoList.project.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No project
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-muted text-xs font-medium">
                      {todoList._count.items}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(todoList.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link href={getTodoListUrl(todoList)}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(todoList.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}
