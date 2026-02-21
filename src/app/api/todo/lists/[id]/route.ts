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

    const todoList = await prisma.todoList.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    return NextResponse.json(todoList);
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
        userId: session.user.id,
      },
    });

    if (!existingTodoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
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
        userId: session.user.id,
      },
    });

    if (!existingTodoList) {
      return NextResponse.json({ error: "Todo list not found" }, { status: 404 });
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
