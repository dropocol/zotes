import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canModifyProject } from "@/lib/permissions";
import { RecurringCompletionStatus } from "@/types/recurring";
import { getUTCToday } from "@/utils/date";

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

    // Find item owned by user or in a collaborated project
    const item = await prisma.todoItem.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { todoList: { project: { collaborators: { some: { userId: session.user.id } } } } },
        ],
      },
      include: {
        subItems: {
          orderBy: { order: "asc" },
        },
        parent: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching todo item:", error);
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
    const {
      title,
      notes,
      status,
      priority,
      dueDate,
      isRecurring,
      frequency,
      daysOfWeek,
      recurrenceStart,
      recurrenceEnd,
      completionDate,
    } = await request.json();

    const existingItem = await prisma.todoItem.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { todoList: { project: { collaborators: { some: { userId: session.user.id } } } } },
        ],
      },
      include: {
        todoList: {
          select: {
            userId: true,
            projectId: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    // Check if user can modify
    const isItemOwner = existingItem.userId === session.user.id;
    let canModify = isItemOwner;

    if (existingItem.todoList.projectId) {
      const access = await getProjectAccess(existingItem.todoList.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine if this item is or will be recurring
    const willBeRecurring = isRecurring === true || (isRecurring === undefined && existingItem.isRecurring);

    // For recurring items, handle status separately from other updates
    if (willBeRecurring && status !== undefined) {
      // Use client-provided date (local) or fall back to server UTC today
      const today = completionDate
        ? new Date(completionDate)
        : getUTCToday();

      // Create or update completion record for today (status goes here, not on the item)
      await prisma.recurringCompletion.upsert({
        where: {
          userId_date_todoItemId: {
            userId: session.user.id,
            date: today,
            todoItemId: id,
          },
        },
        create: {
          userId: session.user.id,
          todoItemId: id,
          date: today,
          status,
        },
        update: {
          status,
        },
      });
    }

    // Determine what status to save on the item itself
    // For recurring items, always keep status as "todo" (completion records track daily status)
    let itemStatusToUpdate = status ?? existingItem.status;
    if (willBeRecurring) {
      // Recurring items should always have "todo" as base status
      // The effective status for each day comes from completion records, not the item itself
      itemStatusToUpdate = "todo";
    }

    // Update the item (for non-recurring: all fields including status; for recurring: all fields except status)
    const item = await prisma.todoItem.update({
      where: { id },
      data: {
        title: title ?? existingItem.title,
        notes: notes ?? existingItem.notes,
        status: itemStatusToUpdate,
        priority: priority ?? existingItem.priority,
        dueDate: willBeRecurring ? null : (dueDate ? new Date(dueDate) : existingItem.dueDate),
        isRecurring: isRecurring !== undefined ? isRecurring : existingItem.isRecurring,
        frequency: frequency !== undefined ? frequency : existingItem.frequency,
        daysOfWeek: daysOfWeek !== undefined ? daysOfWeek : existingItem.daysOfWeek,
        recurrenceStart: recurrenceStart !== undefined
          ? recurrenceStart ? new Date(recurrenceStart) : null
          : existingItem.recurrenceStart,
        recurrenceEnd: recurrenceEnd !== undefined
          ? recurrenceEnd ? new Date(recurrenceEnd) : null
          : existingItem.recurrenceEnd,
      },
      include: {
        subItems: true,
        parent: true,
      },
    });

    // For recurring items with status update, return the effective status
    if (willBeRecurring && status !== undefined) {
      return NextResponse.json({
        ...item,
        status, // Return the effective status from completion
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating todo item:", error);
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

    const existingItem = await prisma.todoItem.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { todoList: { project: { collaborators: { some: { userId: session.user.id } } } } },
        ],
      },
      include: {
        todoList: {
          select: {
            userId: true,
            projectId: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    // Check if user can modify
    const isItemOwner = existingItem.userId === session.user.id;
    let canModify = isItemOwner;

    if (existingItem.todoList.projectId) {
      const access = await getProjectAccess(existingItem.todoList.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.todoItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
