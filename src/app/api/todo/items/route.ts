import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { getUTCToday, toUTCDate } from "@/utils/date";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "upcoming" or "all"

    // Use client-provided local date for recurring completion lookups
    const localDateParam = searchParams.get("date");
    const today = localDateParam ? toUTCDate(localDateParam) : getUTCToday();

    const where: {
      userId: string;
      parentId?: null;
      status?: string | { not: string };
      dueDate?: { not: null };
    } = {
      userId: session.user.id,
      parentId: null, // Only top-level items
    };

    if (filter === "upcoming") {
      // Items with due dates that are not completed
      where.status = { not: "done" };
      where.dueDate = { not: null };
    }

    const items = await prisma.todoItem.findMany({
      where,
      orderBy: filter === "upcoming"
        ? [{ dueDate: "asc" }, { order: "asc" }]
        : [
            { todoList: { project: { name: "asc" } } },
            { todoList: { name: "asc" } },
            { order: "asc" },
          ],
      include: {
        subItems: {
          orderBy: { order: "asc" },
        },
        completions: {
          where: {
            date: today,
          },
        },
        todoList: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Process recurring items to attach effective status
    const processedItems = items.map((item) => {
      if (!item.isRecurring) {
        return item;
      }

      const todayCompletion = item.completions[0];
      const effectiveStatus = todayCompletion?.status || "todo";

      return {
        ...item,
        status: item.status,
        _effectiveStatus: effectiveStatus,
      };
    });

    // For upcoming, filter out items without due dates
    const filteredItems =
      filter === "upcoming"
        ? processedItems.filter((item) => item.dueDate !== null)
        : processedItems;

    // Always paginate
    const { page, limit } = getPaginationParams(searchParams);
    const total = filteredItems.length;
    const start = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(start, start + limit);

    return NextResponse.json(createPaginatedResponse(paginatedItems, total, page, limit));
  } catch (error) {
    console.error("Error fetching todo items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
