import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FolderKanban, FileText, CheckSquare, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const stats = await getStats(session.user.id);

  return (
    <DashboardLayout
      breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || "User"}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold mt-1">{stats.projectsCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
          </div>
          <Link
            href="/projects"
            className={buttonVariants({ variant: "link", className: "mt-4 h-auto p-0" })}
          >
            View all projects
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-2xl font-bold mt-1">{stats.notesCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
          <Link
            href="/notes"
            className={buttonVariants({ variant: "link", className: "mt-4 h-auto p-0" })}
          >
            View all notes
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Todo Lists</p>
              <p className="text-2xl font-bold mt-1">{stats.todoListsCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects"
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
          <Link
            href="/notes/new"
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
