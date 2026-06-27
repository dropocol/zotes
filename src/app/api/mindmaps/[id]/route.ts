import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canModifyProject } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find mindmap owned by user or in a collaborated project
    const mindMap = await prisma.mindMap.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!mindMap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Determine user role for the project
    let userRole: "admin" | "collaborator" | null = null;
    let isOwner = mindMap.userId === session.user.id;

    if (mindMap.projectId) {
      const access = await getProjectAccess(mindMap.projectId, session.user.id);
      userRole = access.role;
      isOwner = access.isOwner || isOwner;
    } else {
      userRole = isOwner ? "admin" : null;
    }

    return NextResponse.json({
      ...mindMap,
      userRole,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching mindmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, data, projectId, pinned } = await request.json();

    const existingMindMap = await prisma.mindMap.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingMindMap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Check if user can modify (only owner of mindmap or admin of project)
    const isOwner = existingMindMap.userId === session.user.id;
    let canModify = isOwner;

    if (existingMindMap.projectId) {
      const access = await getProjectAccess(existingMindMap.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mindMap = await prisma.mindMap.update({
      where: { id },
      data: {
        title: title ?? existingMindMap.title,
        data: data ?? existingMindMap.data,
        projectId: projectId !== undefined ? projectId : existingMindMap.projectId,
        pinned: pinned !== undefined ? pinned : existingMindMap.pinned,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(mindMap);
  } catch (error) {
    console.error("Error updating mindmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingMindMap = await prisma.mindMap.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingMindMap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Check if user can modify (only owner of mindmap or admin of project)
    const isOwner = existingMindMap.userId === session.user.id;
    let canModify = isOwner;

    if (existingMindMap.projectId) {
      const access = await getProjectAccess(existingMindMap.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.mindMap.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mindmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
