import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, targetProjectId, direction } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Get both projects and verify ownership in one query
    const [projectToMove, targetProject] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        select: { id: true, order: true },
      }),
      targetProjectId
        ? prisma.project.findFirst({
            where: { id: targetProjectId, userId: session.user.id },
            select: { id: true, order: true },
          })
        : undefined,
    ]);

    if (!projectToMove) {
      return NextResponse.json(
        { error: "Project not found or not owned by user" },
        { status: 404 }
      );
    }

    // Fast path: simple swap when both projects have unique orders
    if (targetProject && targetProject.order !== projectToMove.order) {
      await prisma.$transaction([
        prisma.project.update({
          where: { id: projectToMove.id },
          data: { order: targetProject.order },
        }),
        prisma.project.update({
          where: { id: targetProject.id },
          data: { order: projectToMove.order },
        }),
      ]);
      return NextResponse.json({ success: true });
    }

    // Slow path: orders collide (e.g. all at 0) or direction-based reordering
    // Recalculate all orders sequentially
    const allProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    const currentIndex = allProjects.findIndex((p) => p.id === projectId);
    if (currentIndex === -1) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    let targetIndex: number;

    if (targetProjectId) {
      targetIndex = allProjects.findIndex((p) => p.id === targetProjectId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { error: "Target project not found" },
          { status: 404 }
        );
      }
    } else if (direction === "up") {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        return NextResponse.json({ error: "Already at top" }, { status: 400 });
      }
    } else if (direction === "down") {
      targetIndex = currentIndex + 1;
      if (targetIndex >= allProjects.length) {
        return NextResponse.json({ error: "Already at bottom" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "targetProjectId or direction is required" },
        { status: 400 }
      );
    }

    if (currentIndex === targetIndex) {
      return NextResponse.json({ success: true });
    }

    // Reorder the array and assign sequential orders
    const reorderedProjects = [...allProjects];
    const [movedProject] = reorderedProjects.splice(currentIndex, 1);
    reorderedProjects.splice(targetIndex, 0, movedProject);

    await prisma.$transaction(
      reorderedProjects.map((project, index) =>
        prisma.project.update({
          where: { id: project.id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
