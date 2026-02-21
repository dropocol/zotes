import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canViewProject, canModifyProject } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: {
      OR?: Array<{ userId: string } | { project: { collaborators: { some: { userId: string } } } }>;
      projectId?: string | null;
    } = {};

    if (projectId) {
      // Check access to project
      const access = await getProjectAccess(projectId, session.user.id);
      if (!canViewProject(access)) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      where.projectId = projectId;
      // Return only notes from this project (owned or collaborated)
      where.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    } else {
      // Get all notes owned by user or from collaborated projects
      where.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { pinned: "desc" },
        { updatedAt: "desc" },
      ],
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

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, projectId } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Note title is required" },
        { status: 400 }
      );
    }

    // If projectId is provided, verify access
    if (projectId) {
      const access = await getProjectAccess(projectId, session.user.id);
      if (!canModifyProject(access)) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content || null,
        projectId: projectId || null,
        userId: session.user.id,
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

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
