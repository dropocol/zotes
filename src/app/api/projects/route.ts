import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forDropdown = searchParams.get("forDropdown") === "true";

    // If forDropdown, return lean data (only id, name, color)
    if (forDropdown) {
      // Get projects owned by user
      const ownedProjects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
        },
      });

      // Get projects where user is a collaborator
      const collaborations = await prisma.projectCollaborator.findMany({
        where: { userId: session.user.id },
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

      // Combine (avoid duplicates)
      const collaboratorProjectIds = new Set(ownedProjects.map((p) => p.id));
      const collaboratorProjects = collaborations
        .filter((c) => !collaboratorProjectIds.has(c.project.id))
        .map((c) => c.project);

      return NextResponse.json([...ownedProjects, ...collaboratorProjects]);
    }

    // Always paginate for normal requests
    const { page, limit } = getPaginationParams(searchParams);
    const skip = (page - 1) * limit;

    // Get counts for pagination
    const [ownedCount, collaboratorCount] = await Promise.all([
      prisma.project.count({ where: { userId: session.user.id } }),
      prisma.projectCollaborator.count({ where: { userId: session.user.id } }),
    ]);

    const total = ownedCount + collaboratorCount;

    // Fetch owned projects (ordered by custom order)
    // Calculate how many owned projects to skip and fetch based on pagination
    let ownedSkip = skip;
    let ownedTake = limit;

    // If skip is past all owned projects, we're in collaborator territory
    if (ownedSkip >= ownedCount) {
      ownedSkip = ownedCount; // Will skip all owned projects
      ownedTake = 0; // Don't fetch any owned projects
    } else if (ownedSkip + ownedTake > ownedCount) {
      // Partial overlap - fetch remaining owned projects
      ownedTake = ownedCount - ownedSkip;
    }

    const ownedProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      skip: ownedSkip,
      take: ownedTake,
      include: {
        _count: {
          select: { notes: true, todoLists: true },
        },
      },
    });

    // Fetch collaborator projects if needed
    let collaborations: any[] = [];
    const remaining = limit - ownedProjects.length;

    if (remaining > 0 && collaboratorCount > 0) {
      let collabSkip = 0;
      if (skip > ownedCount) {
        // We're past owned projects, calculate skip for collaborator projects
        collabSkip = skip - ownedCount;
      }

      collaborations = await prisma.projectCollaborator.findMany({
        where: { userId: session.user.id },
        include: {
          project: {
            include: {
              _count: {
                select: { notes: true, todoLists: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: collabSkip,
        take: remaining,
      });
    }

    // Combine and mark role
    const allProjects = [
      ...ownedProjects.map((p) => ({ ...p, userRole: "admin", isOwner: true })),
      ...collaborations.map((c) => ({
        ...c.project,
        userRole: c.role,
        isOwner: false,
      })),
    ];

    return NextResponse.json(createPaginatedResponse(allProjects, total, page, limit));
  } catch (error) {
    console.error("Error fetching projects:", error);
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

    const { name, description, color } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Get the maximum order value for user's projects
    const maxOrderProject = await prisma.project.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrderProject?.order ?? -1) + 1;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        userId: session.user.id,
        order: nextOrder,
      },
    });

    // Create a default todo list for the project
    await prisma.todoList.create({
      data: {
        name: "Tasks",
        description: `Default task list for ${name}`,
        projectId: project.id,
        userId: session.user.id,
        isDefault: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
