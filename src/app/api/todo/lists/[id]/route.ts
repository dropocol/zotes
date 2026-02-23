import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canViewProject, canModifyProject } from "@/lib/permissions";

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

    // Find todo list owned by user or in a collaborated project
    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: "asc" },
          include: {
            subItems: {
              orderBy: { order: "asc" },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!todoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // Determine user role
    let userRole: "admin" | "collaborator" | null = null;
    let isOwner = todoList.userId === session.user.id;

    if (todoList.projectId) {
      const access = await getProjectAccess(todoList.projectId, session.user.id);
      userRole = access.role;
      isOwner = access.isOwner || isOwner;
    } else {
      userRole = isOwner ? "admin" : null;
    }

    return NextResponse.json({
      ...todoList,
      userRole,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching todo list:", error);
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
    const { name, description } = await request.json();

    const existingTodoList = await prisma.todoList.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingTodoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // Check if user can modify
    const isListOwner = existingTodoList.userId === session.user.id;
    let canModify = isListOwner;

    if (existingTodoList.projectId) {
      const access = await getProjectAccess(existingTodoList.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const todoList = await prisma.todoList.update({
      where: { id },
      data: {
        name: name ?? existingTodoList.name,
        description: description ?? existingTodoList.description,
      },
    });

    return NextResponse.json(todoList);
  } catch (error) {
    console.error("Error updating todo list:", error);
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

    const existingTodoList = await prisma.todoList.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingTodoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // Prevent deleting the default todo list
    if (existingTodoList.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default todo list" },
        { status: 400 }
      );
    }

    // Check if user can modify
    const isListOwner = existingTodoList.userId === session.user.id;
    let canModify = isListOwner;

    if (existingTodoList.projectId) {
      const access = await getProjectAccess(existingTodoList.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.todoList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
