import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canModifyProject } from "@/lib/permissions";
import { RecurringCompletionStatus, getTodayDate } from "@/types/recurring";

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

    // Handle recurring items: status changes go to completion records
    if (existingItem.isRecurring && status !== undefined && status !== existingItem.status) {
      const today = getTodayDate();

      // Create or update completion record for today
      const existingCompletion = await prisma.recurringCompletion.findUnique({
        where: {
          userId_date_todoItemId: {
            userId: session.user.id,
            date: today,
            todoItemId: id,
          },
        },
      });

      if (existingCompletion) {
        await prisma.recurringCompletion.update({
          where: { id: existingCompletion.id },
          data: { status },
        });
      } else {
        await prisma.recurringCompletion.create({
          data: {
            userId: session.user.id,
            todoItemId: id,
            date: today,
            status,
          },
        });
      }

      // Return the item with the effective status
      return NextResponse.json({
        ...existingItem,
        status,
        dueDate: today,
      });
    }

    // For non-recurring items or other field updates, proceed normally
    const item = await prisma.todoItem.update({
      where: { id },
      data: {
        title: title ?? existingItem.title,
        notes: notes ?? existingItem.notes,
        status: status ?? existingItem.status,
        priority: priority ?? existingItem.priority,
        dueDate: dueDate ? new Date(dueDate) : existingItem.dueDate,
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
