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

    const item = await prisma.todoItem.findFirst({
      where: {
        id,
        userId: session.user.id,
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
    const { title, notes, status, priority, dueDate } = await request.json();

    const existingItem = await prisma.todoItem.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    const item = await prisma.todoItem.update({
      where: { id },
      data: {
        title: title ?? existingItem.title,
        notes: notes ?? existingItem.notes,
        status: status ?? existingItem.status,
        priority: priority ?? existingItem.priority,
        dueDate: dueDate ? new Date(dueDate) : existingItem.dueDate,
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
        userId: session.user.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
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
