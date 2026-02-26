import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canViewProject, canModifyProject } from "@/lib/permissions";
import { shouldAppearOnDate, getTodayDate } from "@/types/recurring";

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

    // Verify access to todo list
    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!todoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // Get today's date for recurring item processing
    const today = getTodayDate();

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
        completions: {
          where: {
            date: today,
          },
        },
      },
    });

    // Process recurring items to show today's status
    const processedItems = items.map((item) => {
      if (!item.isRecurring) {
        return item;
      }

      // Check if this recurring item should appear today
      const shouldShowToday = shouldAppearOnDate(item, today);

      if (!shouldShowToday) {
        // Filter out items that shouldn't appear today
        return null;
      }

      // For recurring items, keep the item status as "todo" (recurring items are never "done")
      // The completion status for today is provided separately for the progress indicator
      const todayCompletion = item.completions[0];
      const effectiveStatus = todayCompletion?.status || "todo";

      return {
        ...item,
        // Keep status as the actual item status (always "todo" for recurring items)
        // The UI should use _effectiveStatus for displaying today's completion
        status: item.status, // Don't overwrite with completion status
        dueDate: today, // Set due date to today for recurring items
        _isRecurringToday: true,
        _effectiveStatus: effectiveStatus, // Today's completion status for progress display
      };
    }).filter(Boolean);

    return NextResponse.json(processedItems);
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

    // Find todo list and verify access
    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!todoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
    }

    // Check if user can modify
    const isListOwner = todoList.userId === session.user.id;
    let canModify = isListOwner;

    if (todoList.projectId) {
      const access = await getProjectAccess(todoList.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
