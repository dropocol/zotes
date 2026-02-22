"use client";

import * as React from "react";

import { NavRecentProjects } from "@/components/nav-recent-projects";
import { NavRecentNotes } from "@/components/nav-recent-notes";
import { NavRecentTodos } from "@/components/nav-recent-todos";

type ProjectItem = {
  id: string;
  type: "project";
  url: string;
  name: string;
  color?: string | null;
};

type NoteItem = {
  id: string;
  type: "note";
  url: string;
  title: string;
  project?: { id: string; name: string; color?: string | null } | null;
};

type TodoItem = {
  id: string;
  type: "todo";
  url: string;
  title: string;
  priority?: string;
};

type RecentItems = {
  projects: ProjectItem[];
  notes: NoteItem[];
  todos: TodoItem[];
};

export function NavRecent() {
  const [items, setItems] = React.useState<RecentItems>({
    projects: [],
    notes: [],
    todos: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchRecentItems() {
      try {
        const res = await fetch("/api/recent-items");
        if (res.ok) {
          const data = await res.json();
          setItems(data.groupedItems);
        }
      } catch (error) {
        console.error("Failed to fetch recent items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentItems();
  }, []);

  if (loading) {
    return <RecentItemsSkeleton />;
  }

  const hasAnyItems =
    items.projects.length > 0 ||
    items.notes.length > 0 ||
    items.todos.length > 0;

  if (!hasAnyItems) {
    return null;
  }

  return (
    <>
      <NavRecentProjects items={items.projects} />
      <NavRecentNotes items={items.notes} />
      <NavRecentTodos items={items.todos} />
    </>
  );
}

function RecentItemsSkeleton() {
  return (
    <>
      <div className="p-2 space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-sidebar-accent" />
        <div className="space-y-1">
          <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
          <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
        </div>
      </div>
      <div className="p-2 space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-sidebar-accent" />
        <div className="space-y-1">
          <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
          <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
        </div>
      </div>
    </>
  );
}
