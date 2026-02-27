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
    const projectId = searchParams.get("projectId");
    const excludeDefault = searchParams.get("excludeDefault") === "true";

    const where: { userId: string; projectId?: string; isDefault?: boolean } = {
      userId: session.user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (excludeDefault) {
      where.isDefault = false;
    }

    const todoLists = await prisma.todoList.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    // Ensure only one list is marked as default per user
    const defaultLists = todoLists.filter((list) => list.isDefault);
    if (defaultLists.length > 1) {
      // Keep only the first one as default, unset others
      for (const list of defaultLists.slice(1)) {
        await prisma.todoList.update({
          where: { id: list.id },
          data: { isDefault: false },
        });
      }
    }

    // Always paginate
    const { page, limit } = getPaginationParams(searchParams);
    const total = todoLists.length;
    const start = (page - 1) * limit;
    const paginatedLists = todoLists.slice(start, start + limit);

    return NextResponse.json(createPaginatedResponse(paginatedLists, total, page, limit));
  } catch (error) {
    console.error("Error fetching todo lists:", error);
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

    const { name, description, projectId } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Todo list name is required" },
        { status: 400 }
      );
    }

    // If projectId is provided, verify it belongs to user
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    const todoList = await prisma.todoList.create({
      data: {
        name,
        description: description || null,
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

    return NextResponse.json(todoList, { status: 201 });
  } catch (error) {
    console.error("Error creating todo list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
