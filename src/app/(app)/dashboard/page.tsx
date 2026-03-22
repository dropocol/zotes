import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Plus,
  Clock,
  ChevronRight,
  Home,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your projects, notes, and tasks",
};

export const dynamic = "force-dynamic";

async function getStats(userId: string) {
  const [projectsCount, notesCount, todoListsCount] = await Promise.all([
    prisma.project.count({
      where: { userId },
    }),
    prisma.note.count({
      where: { userId },
    }),
    prisma.todoList.count({
      where: { userId },
    }),
  ]);

  return {
    projectsCount,
    notesCount,
    todoListsCount,
  };
}

async function getRecentItems(userId: string) {
  const [recentProjects, recentNotes, recentTodoItems] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        color: true,
        updatedAt: true,
      },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
    prisma.todoItem.findMany({
      where: {
        userId,
        status: { not: "done" },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        todoList: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
    }),
  ]);

  return { recentProjects, recentNotes, recentTodoItems };
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getPriorityColor(priority: string): string {
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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [stats, recentItems] = await Promise.all([
    getStats(session.user.id),
    getRecentItems(session.user.id),
  ]);

  return (
    <DashboardLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name || "User"}`}
        icon={Home}
        className="mb-8"
      >
        <Link href="/projects" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Project
        </Link>
        <Link
          href="/notes/new"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Note
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Link
          href="/projects"
          className="group rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Projects</span>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.projectsCount}</p>
        </Link>

        <Link
          href="/notes"
          className="group rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Notes</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.notesCount}</p>
        </Link>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Todo Lists</span>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.todoListsCount}</p>
        </div>
      </div>

      {/* Recent Items Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Notes */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Recent Notes</h2>
            </div>
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {recentItems.recentNotes.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No notes yet.{" "}
                <Link
                  href="/notes/new"
                  className="text-primary hover:underline"
                >
                  Create your first note
                </Link>
              </div>
            ) : (
              recentItems.recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {note.project && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: note.project.color
                              ? `${note.project.color}20`
                              : undefined,
                            color: note.project.color || "inherit",
                          }}
                        >
                          {note.project.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Active Tasks</h2>
            </div>
          </div>
          <div className="divide-y">
            {recentItems.recentTodoItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No active tasks
              </div>
            ) : (
              recentItems.recentTodoItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.todoList.projectId}/todos/${item.todoList.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors group"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      getPriorityColor(item.priority),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {item.todoList.name}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      {recentItems.recentProjects.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Recent Projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors group"
              >
                <div
                  className="w-3 h-3 rounded shrink-0"
                  style={{ backgroundColor: project.color || "#6b7280" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
