import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurringCompletionStatus } from "@/types/recurring";
import { getWeekStart, getWeekEnd, toUTCDate, isFutureDate } from "@/utils/date";

// GET - Fetch completions for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Get all recurring todo items for the user
    const recurringItems = await prisma.todoItem.findMany({
      where: {
        userId: session.user.id,
        isRecurring: true,
        parentId: null, // Only top-level items
      },
      include: {
        completions: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        },
      },
    });

    return NextResponse.json({
      items: recurringItems,
    });
  } catch (error) {
    console.error("Error fetching recurring completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Toggle completion status for a specific date
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { todoItemId, date, status } = await request.json();

    if (!todoItemId || !date) {
      return NextResponse.json(
        { error: "todoItemId and date are required" },
        { status: 400 }
      );
    }

    // Verify the todo item belongs to the user
    const todoItem = await prisma.todoItem.findFirst({
      where: {
        id: todoItemId,
        userId: session.user.id,
      },
    });

    if (!todoItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    const completionDate = toUTCDate(date);

    // Prevent marking future dates
    if (isFutureDate(completionDate)) {
      return NextResponse.json(
        { error: "Cannot mark future dates" },
        { status: 400 }
      );
    }

    // Try to find existing completion
    const existingCompletion = await prisma.recurringCompletion.findUnique({
      where: {
        userId_date_todoItemId: {
          userId: session.user.id,
          date: completionDate,
          todoItemId,
        },
      },
    });

    let completion;

    if (existingCompletion) {
      // Toggle status: done -> todo, todo -> done, skipped -> done
      const newStatus =
        status ||
        (existingCompletion.status === RecurringCompletionStatus.DONE
          ? RecurringCompletionStatus.TODO
          : RecurringCompletionStatus.DONE);

      completion = await prisma.recurringCompletion.update({
        where: { id: existingCompletion.id },
        data: { status: newStatus },
      });
    } else {
      // Create new completion
      completion = await prisma.recurringCompletion.create({
        data: {
          userId: session.user.id,
          todoItemId,
          date: completionDate,
          status: status || RecurringCompletionStatus.DONE,
        },
      });
    }

    return NextResponse.json(completion);
  } catch (error) {
    console.error("Error toggling recurring completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
