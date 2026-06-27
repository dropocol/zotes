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
      // Return only mindmaps from this project (owned or collaborated)
      baseWhere.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    } else if (personalOnly) {
      // Get only personal mindmaps (not assigned to any project)
      baseWhere.userId = session.user.id;
      baseWhere.projectId = null;
    } else {
      // Get all mindmaps owned by user or from collaborated projects
      baseWhere.OR = [
        { userId: session.user.id },
        { project: { collaborators: { some: { userId: session.user.id } } } },
      ];
    }

    // Always paginate
    const { page, limit } = getPaginationParams(searchParams);

    // Get pinned mindmaps separately (always shown first)
    const pinnedMindMaps = await prisma.mindMap.findMany({
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

    // Get total count of non-pinned mindmaps
    const totalNonPinned = await prisma.mindMap.count({
      where: { ...baseWhere, pinned: false },
    });

    // Calculate how many non-pinned mindmaps to fetch
    const pinnedCount = pinnedMindMaps.length;
    const effectiveLimit = Math.max(0, limit - pinnedCount);
    const effectiveSkip = Math.max(0, (page - 1) * limit - pinnedCount);

    // Fetch non-pinned mindmaps with pagination
    const nonPinnedMindMaps = effectiveLimit > 0 ? await prisma.mindMap.findMany({
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

    // Combine pinned and non-pinned mindmaps
    const mindMaps = [...pinnedMindMaps, ...nonPinnedMindMaps];
    const total = pinnedCount + totalNonPinned;

    return NextResponse.json(createPaginatedResponse(mindMaps, total, page, limit));
  } catch (error) {
    console.error("Error fetching mindmaps:", error);
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

    const { title, data, projectId } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Mindmap title is required" },
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

    const mindMap = await prisma.mindMap.create({
      data: {
        title,
        data: data || { nodes: [], edges: [] },
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

    return NextResponse.json(mindMap, { status: 201 });
  } catch (error) {
    console.error("Error creating mindmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
