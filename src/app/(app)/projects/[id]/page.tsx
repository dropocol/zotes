import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectPageClient } from "./page-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      todoLists: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { items: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectPageClient
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
      }}
      notes={project.notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
      }))}
      todoLists={project.todoLists.map((todoList) => ({
        id: todoList.id,
        name: todoList.name,
        _count: { items: todoList._count.items },
      }))}
    />
  );
}
