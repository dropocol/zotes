"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { TodoListForm } from "@/components/todos/todo-list-form";
import { DashboardLayout } from "@/components/dashboard-layout";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
}

interface Note {
  id: string;
  title: string;
  content?: string | null;
}

interface TodoList {
  id: string;
  name: string;
  _count: {
    items: number;
  };
}

interface ProjectPageClientProps {
  project: Project | null;
  notes: Note[];
  todoLists: TodoList[];
}

export function ProjectPageClient({
  project,
  notes,
  todoLists,
}: ProjectPageClientProps) {
  const [isTodoListFormOpen, setIsTodoListFormOpen] = useState(false);

  if (!project) {
    notFound();
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Projects", href: "/projects" },
        { title: project.name },
      ]}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: project.color || "#f97316" }}
          />
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        {project.description && (
          <p className="text-muted-foreground mt-1 ml-4">
            {project.description}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Todo Lists */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Todo Lists</h2>
            <Button size="sm" variant="outline" onClick={() => setIsTodoListFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add List
            </Button>
          </div>
          {todoLists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No todo lists yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todoLists.map((todoList) => (
                <Link
                  key={todoList.id}
                  href={`/projects/${project.id}/todos/${todoList.id}`}
                  className="block"
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center justify-between py-3">
                      <span className="font-medium">{todoList.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {todoList._count.items} items
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Notes</h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/notes/new?projectId=${project.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Link>
            </Button>
          </div>
          {notes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notes yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block"
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="py-3">
                      <div className="font-medium">{note.title}</div>
                      {note.content && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {note.content.slice(0, 100)}...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <TodoListForm
        open={isTodoListFormOpen}
        onOpenChange={setIsTodoListFormOpen}
        projectId={project.id}
      />
    </DashboardLayout>
  );
}
