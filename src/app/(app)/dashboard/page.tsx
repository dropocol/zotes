import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiBand, KpiCell } from "@/components/kpi-band";
import { computeJobStats } from "@/lib/job-stats";
import { BarActivityChart } from "@/components/jobs/stats-view/activity-chart";
import {
  Briefcase,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  FolderKanban,
  Plus,
  Trophy,
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
  const [projectsCount, notesCount, todoListsCount, openTasksCount] =
    await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.todoList.count({ where: { userId } }),
      prisma.todoItem.count({ where: { userId, status: { not: "done" } } }),
    ]);

  return {
    projectsCount,
    notesCount,
    todoListsCount,
    openTasksCount,
  };
}

async function getRecentItems(userId: string) {
  const [recentProjects, recentNotes, recentTodoItems] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: 5,
      include: {
        _count: {
          select: { notes: true, todoLists: true },
        },
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

/** Zounty's "View all →" header link pattern */
function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

function SectionCard({
  icon: Icon,
  title,
  viewAllHref,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h2 className="font-medium">{title}</h2>
        </div>
        {viewAllHref && <HeaderLink href={viewAllHref}>View all</HeaderLink>}
      </div>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [stats, recentItems, jobApplications] = await Promise.all([
    getStats(session.user.id),
    getRecentItems(session.user.id),
    prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      include: { interviews: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const jobStats = computeJobStats(jobApplications, "30d");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.user.name || "User"} ·{" "}
              {stats.projectsCount} projects · {stats.notesCount} notes ·{" "}
              {stats.openTasksCount} open tasks
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        {/* KPI band — one card, hairline-divided cells */}
        <KpiBand>
          <KpiCell
            icon={FolderKanban}
            label="Projects"
            value={String(stats.projectsCount)}
            sub={`${recentItems.recentProjects.length} recent`}
            href="/projects"
          />
          <KpiCell
            icon={FileText}
            label="Notes"
            value={String(stats.notesCount)}
            sub={`${recentItems.recentNotes.length} recent`}
            href="/notes"
          />
          <KpiCell
            icon={CheckSquare}
            label="Open Tasks"
            value={String(stats.openTasksCount)}
            sub={`${stats.todoListsCount} todo lists`}
            href="/todos"
          />
          <KpiCell
            icon={Briefcase}
            label="Job Apps · 30d"
            value={String(jobStats.summary.applied)}
            sub={`${jobStats.summary.responseRate}% response rate`}
            valueClassName={
              jobStats.summary.applied > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : undefined
            }
            href="/jobs/stats"
          />
        </KpiBand>

        {/* Job hunt section — shown whenever there are any applications;
            the chart shows its own empty state for quiet windows */}
        {jobApplications.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
              <div>
                <h2 className="font-medium">Job Hunt</h2>
                <p className="text-xs text-muted-foreground">
                  Applications per day, last 30 days — with replies &amp;
                  interviews
                </p>
              </div>
              <HeaderLink href="/jobs/stats">View full stats</HeaderLink>
            </div>
            <div className="grid gap-px bg-border lg:grid-cols-[3fr_2fr]">
              <div className="bg-card p-4 md:p-5">
                <BarActivityChart
                  series={jobStats.series}
                  bucket={jobStats.bucket}
                />
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                <KpiCell
                  icon={Briefcase}
                  label="This week"
                  value={String(jobStats.pace.thisWeek)}
                  sub={`${jobStats.pace.lastWeek} last week`}
                />
                <KpiCell
                  icon={Flame}
                  label="Streak"
                  value={`${jobStats.pace.currentStreak}d`}
                  sub={`best: ${jobStats.pace.longestStreak}d`}
                  valueClassName={
                    jobStats.pace.currentStreak > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : undefined
                  }
                />
                <KpiCell
                  icon={FileText}
                  label="Responses"
                  value={String(jobStats.summary.responded)}
                  sub={`${jobStats.summary.avgResponseDays ?? "—"}d avg reply`}
                />
                <KpiCell
                  icon={Trophy}
                  label="Offers"
                  value={String(jobStats.summary.offers)}
                  sub={`${jobStats.summary.interviewRate}% interview rate`}
                  valueClassName={
                    jobStats.summary.offers > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Recent content */}
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          {/* Left: notes + tasks */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <SectionCard icon={FileText} title="Recent Notes" viewAllHref="/notes">
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
                      className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {note.title}
                      </p>
                      {note.project && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-xs"
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
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(note.updatedAt)}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={CheckSquare}
              title="Active Tasks"
              viewAllHref="/todos"
            >
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
                      className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          getPriorityColor(item.priority),
                        )}
                      />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.todoList.name}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          {/* Right: projects */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <SectionCard
              icon={FolderKanban}
              title="Recent Projects"
              viewAllHref="/projects"
            >
              <div className="divide-y">
                {recentItems.recentProjects.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No projects yet.{" "}
                    <Link
                      href="/projects"
                      className="text-primary hover:underline"
                    >
                      Create your first project
                    </Link>
                  </div>
                ) : (
                  recentItems.recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color || "#f97316" }}
                      />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {project.name}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {project._count?.notes || 0} notes ·{" "}
                        {project._count?.todoLists || 0} lists
                      </span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {formatDate(project.updatedAt)}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
