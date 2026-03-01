import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canViewProject, canModifyProject } from "@/lib/permissions";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const personalOnly = searchParams.get("personalOnly") === "true";

    const baseWhere: {
      userId?: string;
      OR?: Array<{ userId: string } | { project: { collaborators: { some: { userId: string } } } }>;
      projectId?: string | null;
    } = {};

    if (projectId) {
      // Check access to project
      const access = await getProjectAccess(projectId, session.user.id);
      if (!canViewProject(access)) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      baseWhere.projectId = projectId;
      // Return only notes from this project (owned or collaborated)
      baseWhere.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    } else if (personalOnly) {
      // Get only personal notes (not assigned to any project)
      baseWhere.userId = session.user.id;
      baseWhere.projectId = null;
    } else {
      // Get all notes owned by user or from collaborated projects
      baseWhere.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    }

    // Always paginate
    const { page, limit } = getPaginationParams(searchParams);

    // Get pinned notes separately (always shown first)
    const pinnedNotes = await prisma.note.findMany({
      where: { ...baseWhere, pinned: true },
      orderBy: [{ updatedAt: "desc" }],
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

    // Get total count of non-pinned notes
    const totalNonPinned = await prisma.note.count({
      where: { ...baseWhere, pinned: false },
    });

    // Calculate how many non-pinned notes to fetch
    const pinnedCount = pinnedNotes.length;
    const effectiveLimit = Math.max(0, limit - pinnedCount);
    const effectiveSkip = Math.max(0, (page - 1) * limit - pinnedCount);

    // Fetch non-pinned notes with pagination
    const nonPinnedNotes = effectiveLimit > 0 ? await prisma.note.findMany({
      where: { ...baseWhere, pinned: false },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      skip: effectiveSkip,
      take: effectiveLimit,
    }) : [];

    // Combine pinned and non-pinned notes
    const notes = [...pinnedNotes, ...nonPinnedNotes];
    const total = pinnedCount + totalNonPinned;

    return NextResponse.json(createPaginatedResponse(notes, total, page, limit));
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
