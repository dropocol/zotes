"use client";

import * as React from "react";
import { FileText, FolderKanban, CheckSquare, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

function getPriorityColor(priority?: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

export function NavRecent() {
  const [items, setItems] = React.useState<RecentItems>({
    projects: [],
    notes: [],
    todos: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [openSections, setOpenSections] = React.useState({
    projects: true,
    notes: true,
    todos: true,
  });

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
    return (
      <>
        <SidebarGroup className="overflow-hidden">
          <SidebarGroupLabel>
            <FolderKanban className="size-3" />
            Projects
          </SidebarGroupLabel>
          <SidebarMenu>
            {[...Array(2)].map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="overflow-hidden">
          <SidebarGroupLabel>
            <FileText className="size-3" />
            Notes
          </SidebarGroupLabel>
          <SidebarMenu>
            {[...Array(2)].map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="h-8 animate-pulse rounded-md bg-sidebar-accent" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  }

  const hasAnyItems =
    items.projects.length > 0 ||
    items.notes.length > 0 ||
    items.todos.length > 0;

  if (!hasAnyItems) {
    return null;
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {items.projects.length > 0 && (
        <SidebarGroup className="overflow-hidden">
          <Collapsible
            open={openSections.projects}
            onOpenChange={() => toggleSection("projects")}
            className="group/collapsible"
          >
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center gap-1.5">
                <FolderKanban className="size-3" />
                <span className="flex-1 text-left">Projects</span>
                <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                {items.projects.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                    >
                      <Link href={item.url}>
                        <FolderKanban className="size-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.color && (
                          <div
                            className="ml-auto size-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      )}

      {items.notes.length > 0 && (
        <SidebarGroup className="overflow-hidden">
          <Collapsible
            open={openSections.notes}
            onOpenChange={() => toggleSection("notes")}
            className="group/collapsible"
          >
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center gap-1.5">
                <FileText className="size-3" />
                <span className="flex-1 text-left">Notes</span>
                <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                {items.notes.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <FileText className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {item.project && (
                          <span
                            className="ml-auto text-[10px] px-1 py-0.5 rounded shrink-0 truncate max-w-16"
                            style={{
                              backgroundColor: item.project.color
                                ? `${item.project.color}20`
                                : undefined,
                              color: item.project.color || "inherit",
                            }}
                          >
                            {item.project.name}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      )}

      {items.todos.length > 0 && (
        <SidebarGroup className="overflow-hidden">
          <Collapsible
            open={openSections.todos}
            onOpenChange={() => toggleSection("todos")}
            className="group/collapsible"
          >
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center gap-1.5">
                <CheckSquare className="size-3" />
                <span className="flex-1 text-left">Todos</span>
                <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                {items.todos.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <CheckSquare className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        <div
                          className={cn(
                            "ml-auto size-2 rounded-full shrink-0",
                            getPriorityColor(item.priority)
                          )}
                        />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      )}
    </>
  );
}
