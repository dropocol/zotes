import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify todo list belongs to user
    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!todoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    const items = await prisma.todoItem.findMany({
      where: {
        todoListId: id,
        parentId: null,
      },
      orderBy: { order: "asc" },
      include: {
        subItems: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching todo items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, parentId } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Verify todo list belongs to user
    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!todoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // If parentId is provided, verify it exists and is not a sub-item (enforce one level)
    if (parentId) {
      const parentItem = await prisma.todoItem.findFirst({
        where: {
          id: parentId,
          todoListId: id,
          parentId: null, // Only top-level items can have sub-items
        },
      });

      if (!parentItem) {
        return NextResponse.json(
          { error: "Parent item not found or is already a sub-item" },
          { status: 400 }
        );
      }
    }

    // Get max order for the list (or parent)
    const maxOrder = await prisma.todoItem.aggregate({
      where: {
        todoListId: id,
        parentId: parentId || null,
      },
      _max: { order: true },
    });

    const item = await prisma.todoItem.create({
      data: {
        title,
        todoListId: id,
        userId: session.user.id,
        parentId: parentId || null,
        order: (maxOrder._max.order || 0) + 1,
      },
      include: {
        subItems: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating todo item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
