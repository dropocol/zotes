import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { getUTCToday, toUTCDate } from "@/utils/date";

// Types for raw SQL query results
interface RawTodoItem {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  order: number;
  is_recurring: boolean;
  frequency: string | null;
  days_of_week: string | null;
  recurrence_start: Date | null;
  recurrence_end: Date | null;
  created_at: Date;
  updated_at: Date;
  parent_id: string | null;
  todo_list_id: string;
  user_id: string;
  "todoList.id": string;
  "todoList.name": string;
  "todoList.projectId": string | null;
  "todoList.project.id": string | null;
  "todoList.project.name": string | null;
  "todoList.project.color": string | null;
}

interface RawSubItem {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  order: number;
  is_recurring: boolean;
  frequency: string | null;
  days_of_week: string | null;
  recurrence_start: Date | null;
  recurrence_end: Date | null;
  created_at: Date;
  updated_at: Date;
  parent_id: string;
  todo_list_id: string;
  user_id: string;
}

// Transformed sub-item (camelCase)
interface SubItem {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  order: number;
  isRecurring: boolean;
  frequency: string | null;
  daysOfWeek: string | null;
  recurrenceStart: Date | null;
  recurrenceEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parentId: string;
  todoListId: string;
  userId: string;
  subItems: SubItem[];
  completions: Completion[];
}

interface Completion {
  id: string;
  todoItemId: string;
  date: Date;
  status: string;
}

interface RawCompletion {
  id: string;
  todo_item_id: string;
  date: Date;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "upcoming" or "all"
    const sort = searchParams.get("sort");
    const projectOnly = searchParams.get("projectOnly") === "true";

    // Use client-provided local date for recurring completion lookups
    const localDateParam = searchParams.get("date");
    const today = localDateParam ? toUTCDate(localDateParam) : getUTCToday();

    const { page, limit } = getPaginationParams(searchParams);
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [`ti.user_id = $1`, `ti.parent_id IS NULL`];
    const params: (string | number | Date)[] = [session.user.id];
    let paramIndex = 2;

    if (filter === "upcoming") {
      conditions.push(`ti.status != 'done'`);
      conditions.push(`ti.due_date IS NOT NULL`);
    }

    if (projectOnly) {
      conditions.push(`tl.project_id IS NOT NULL`);
    }

    const whereClause = conditions.join(" AND ");

    // Build ORDER BY based on sort param
    let orderByClause: string;
    if (filter === "upcoming") {
      orderByClause = "ti.due_date ASC, ti.order ASC";
    } else if (sort === "dueDate") {
      orderByClause = "ti.due_date ASC, ti.order ASC";
    } else if (sort === "dueDateDesc") {
      orderByClause = "ti.due_date DESC, ti.order ASC";
    } else if (sort === "priority") {
      // Use CASE for priority weight: urgent(0) > high(1) > medium(2) > low(3)
      orderByClause = `CASE ti.priority
        WHEN 'urgent' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END ASC, ti.order ASC`;
    } else if (sort === "status") {
      // Use CASE for status order: todo(0) > in-progress(1) > done(2)
      orderByClause = `CASE ti.status
        WHEN 'todo' THEN 0
        WHEN 'in-progress' THEN 1
        WHEN 'done' THEN 2
        ELSE 3
      END ASC, ti.order ASC`;
    } else if (sort === "createdAt") {
      orderByClause = "ti.created_at DESC, ti.order ASC";
    } else if (sort === "updatedAt") {
      orderByClause = "ti.updated_at DESC, ti.order ASC";
    } else {
      // Default: project name -> list name -> order
      orderByClause = "p.name ASC, tl.name ASC, ti.order ASC";
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT ti.id) as total
      FROM todo_items ti
      JOIN todo_lists tl ON ti.todo_list_id = tl.id
      LEFT JOIN projects p ON tl.project_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      countQuery,
      ...params
    );
    const total = Number(countResult[0]?.total || 0);

    // Fetch paginated items with all relations
    const itemsQuery = `
      SELECT
        ti.id,
        ti.title,
        ti.notes,
        ti.status,
        ti.priority,
        ti.due_date,
        ti.order,
        ti.is_recurring,
        ti.frequency,
        ti.days_of_week,
        ti.recurrence_start,
        ti.recurrence_end,
        ti.created_at,
        ti.updated_at,
        ti.parent_id,
        ti.todo_list_id,
        ti.user_id,
        tl.id as "todoList.id",
        tl.name as "todoList.name",
        tl.project_id as "todoList.projectId",
        p.id as "todoList.project.id",
        p.name as "todoList.project.name",
        p.color as "todoList.project.color"
      FROM todo_items ti
      JOIN todo_lists tl ON ti.todo_list_id = tl.id
      LEFT JOIN projects p ON tl.project_id = p.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const items = await prisma.$queryRawUnsafe<RawTodoItem[]>(itemsQuery, ...params);

    // Fetch sub-items for each item
    const itemIds = items.map((i) => i.id);
    const subItemsMap = new Map<string, SubItem[]>();

    if (itemIds.length > 0) {
      const subItemsQuery = `
        SELECT
          id, title, notes, status, priority, due_date, "order",
          is_recurring, frequency, days_of_week, recurrence_start, recurrence_end,
          created_at, updated_at, parent_id, todo_list_id, user_id
        FROM todo_items
        WHERE parent_id = ANY($1::text[])
        ORDER BY "order" ASC
      `;
      const subItems = await prisma.$queryRawUnsafe<RawSubItem[]>(
        subItemsQuery,
        itemIds
      );

      for (const sub of subItems) {
        const parentId = sub.parent_id;
        if (!subItemsMap.has(parentId)) {
          subItemsMap.set(parentId, []);
        }
        subItemsMap.get(parentId)!.push({
          id: sub.id,
          title: sub.title,
          notes: sub.notes,
          status: sub.status,
          priority: sub.priority,
          dueDate: sub.due_date,
          order: sub.order,
          isRecurring: sub.is_recurring,
          frequency: sub.frequency,
          daysOfWeek: sub.days_of_week,
          recurrenceStart: sub.recurrence_start,
          recurrenceEnd: sub.recurrence_end,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          parentId: sub.parent_id,
          todoListId: sub.todo_list_id,
          userId: sub.user_id,
          subItems: [],
          completions: [],
        });
      }
    }

    // Fetch completions for recurring items
    const completionsMap = new Map<string, Completion[]>();
    const recurringItemIds = items.filter((i) => i.is_recurring).map((i) => i.id);

    if (recurringItemIds.length > 0) {
      const completionsQuery = `
        SELECT id, todo_item_id, date, status
        FROM recurring_completions
        WHERE todo_item_id = ANY($1::text[]) AND date = $2
      `;
      const completions = await prisma.$queryRawUnsafe<RawCompletion[]>(
        completionsQuery,
        recurringItemIds,
        today
      );

      for (const comp of completions) {
        const itemId = comp.todo_item_id;
        if (!completionsMap.has(itemId)) {
          completionsMap.set(itemId, []);
        }
        completionsMap.get(itemId)!.push({
          id: comp.id,
          todoItemId: comp.todo_item_id,
          date: comp.date,
          status: comp.status,
        });
      }
    }

    // Assemble final response
    const processedItems = items.map((item) => {
      const subItems = subItemsMap.get(item.id) || [];
      const completions = completionsMap.get(item.id) || [];

      const baseItem = {
        id: item.id,
        title: item.title,
        notes: item.notes,
        status: item.status,
        priority: item.priority,
        dueDate: item.due_date,
        order: item.order,
        isRecurring: item.is_recurring,
        frequency: item.frequency,
        daysOfWeek: item.days_of_week,
        recurrenceStart: item.recurrence_start,
        recurrenceEnd: item.recurrence_end,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        parentId: item.parent_id,
        todoListId: item.todo_list_id,
        userId: item.user_id,
        subItems,
        completions,
        todoList: {
          id: item["todoList.id"],
          name: item["todoList.name"],
          projectId: item["todoList.projectId"],
          project: item["todoList.project.id"]
            ? {
                id: item["todoList.project.id"],
                name: item["todoList.project.name"],
                color: item["todoList.project.color"],
              }
            : null,
        },
      };

      // For recurring items, attach effective status
      if (item.is_recurring) {
        const todayCompletion = completions[0];
        const effectiveStatus = todayCompletion?.status || "todo";
        return {
          ...baseItem,
          status: item.status,
          _effectiveStatus: effectiveStatus,
        };
      }

      return baseItem;
    });

    // For upcoming, filter out items without due dates (already done in WHERE)
    const finalItems = filter === "upcoming"
      ? processedItems.filter((item) => item.dueDate !== null)
      : processedItems;

    return NextResponse.json(
      createPaginatedResponse(finalItems, total, page, limit)
    );
  } catch (error) {
    console.error("Error fetching todo items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
