import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [recentProjects, recentNotes, recentTodoItems] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        color: true,
        updatedAt: true,
      },
    }),
    prisma.note.findMany({
      where: { userId: session.user.id },
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
        userId: session.user.id,
        status: { not: "done" },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
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

  const groupedItems = {
    projects: recentProjects.map((item) => ({
      id: item.id,
      type: "project" as const,
      url: `/projects/${item.id}`,
      name: item.name,
      color: item.color,
    })),
    notes: recentNotes.map((item) => ({
      id: item.id,
      type: "note" as const,
      url: `/notes/${item.id}`,
      title: item.title,
      project: item.project,
    })),
    todos: recentTodoItems.map((item) => ({
      id: item.id,
      type: "todo" as const,
      url: `/projects/${item.todoList.projectId}/todos/${item.todoList.id}`,
      title: item.title,
      priority: item.priority,
    })),
  };

  return NextResponse.json({ groupedItems });
}
