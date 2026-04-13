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

    // Get all owned projects ordered by current order
    const allProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, order: true },
    });

    const currentIndex = allProjects.findIndex((p) => p.id === projectId);

    if (currentIndex === -1) {
      return NextResponse.json(
        { error: "Project not found or not owned by user" },
        { status: 404 }
      );
    }

    let targetIndex: number;

    // Handle legacy direction-based reordering
    if (direction && !targetProjectId) {
      if (direction !== "up" && direction !== "down") {
        return NextResponse.json(
          { error: "direction must be 'up' or 'down'" },
          { status: 400 }
        );
      }

      if (direction === "up") {
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) {
          return NextResponse.json({ error: "Already at top" }, { status: 400 });
        }
      } else {
        targetIndex = currentIndex + 1;
        if (targetIndex >= allProjects.length) {
          return NextResponse.json({ error: "Already at bottom" }, { status: 400 });
        }
      }
    } else if (targetProjectId) {
      // Handle drag-and-drop reordering with targetProjectId
      targetIndex = allProjects.findIndex((p) => p.id === targetProjectId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { error: "Target project not found or not owned by user" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "targetProjectId is required for drag-and-drop" },
        { status: 400 }
      );
    }

    if (currentIndex === targetIndex) {
      return NextResponse.json({ success: true });
    }

    // Recalculate all orders to ensure they're sequential
    // This handles the case where all projects have order: 0
    const reorderedProjects = [...allProjects];
    const [movedProject] = reorderedProjects.splice(currentIndex, 1);
    reorderedProjects.splice(targetIndex, 0, movedProject);

    // Update all projects with new sequential orders
    const updates = reorderedProjects.map((project, index) =>
      prisma.project.update({
        where: { id: project.id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
