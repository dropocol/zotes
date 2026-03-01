"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { RecurringWeeklyView } from "@/components/recurring";
import { RecurringCompletionStatus, RecurringTodoItem, RecurringCompletion } from "@/types/recurring";
import { isSameDay, toUTCDate } from "@/utils/date";

interface RecurringItem {
  id: string;
  title: string;
  frequency?: string | null;
  daysOfWeek?: string | null;
  recurrenceStart?: string | null;
  recurrenceEnd?: string | null;
  completions: Array<{
    id: string;
    date: string;
    status: string;
  }>;
}

interface RecurringWeeklyViewClientProps {
  initialItems: RecurringItem[] | RecurringTodoItem[];
  singleTaskMode?: boolean;
}

export function RecurringWeeklyViewClient({
  initialItems,
  singleTaskMode = false,
}: RecurringWeeklyViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Convert initialItems to RecurringItem format
  const convertToRecurringItem = (item: any): RecurringItem => ({
    id: item.id,
    title: item.title,
    frequency: item.frequency,
    daysOfWeek: typeof item.daysOfWeek === 'string' ? item.daysOfWeek : null,
    recurrenceStart: item.recurrenceStart,
    recurrenceEnd: item.recurrenceEnd,
    completions: item.completions?.map((c: any) => ({
      id: c.id,
      date: c.date,
      status: c.status,
    })) || [],
  });

  const [items, setItems] = useState<RecurringItem[]>(() => {
    if (Array.isArray(initialItems) && initialItems.length > 0) {
      if ('completions' in initialItems[0]) {
        return initialItems as RecurringItem[];
      }
      return initialItems.map(convertToRecurringItem);
    }
    return [];
  });

  // Get initial date from URL or use today
  const dateParam = searchParams.get("date");
  const taskIdParam = searchParams.get("taskId");
  const initialDate = dateParam ? toUTCDate(dateParam) : new Date();

  // Sync items when initialItems changes
  useEffect(() => {
    if (Array.isArray(initialItems) && initialItems.length > 0) {
      if ('completions' in initialItems[0]) {
        setItems(initialItems as RecurringItem[]);
      } else {
        setItems(initialItems.map(convertToRecurringItem));
      }
    }
  }, [initialItems]);

  // Update URL when date changes
  const handleDateChange = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const url = new URL(window.location.href);
    url.searchParams.set("date", dateStr);
    // Preserve taskId if present
    if (taskIdParam) {
      url.searchParams.set("taskId", taskIdParam);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router, taskIdParam]);

  const handleToggleCompletion = useCallback(
    async (todoItemId: string, date: Date) => {
      try {
        const response = await fetch("/api/recurring/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            todoItemId,
            date: date.toISOString(),
          }),
        });

        if (response.ok) {
          const completion = await response.json();

          // Update local state
          setItems((prevItems) =>
            prevItems.map((item) => {
              if (item.id !== todoItemId) return item;

              // Use UTC-based comparison to find existing completion
              const existingIndex = item.completions.findIndex(
                (c) => isSameDay(c.date, date)
              );

              let newCompletions: RecurringCompletion[] | any[];
              if (existingIndex >= 0) {
                // Update existing completion
                newCompletions = [...item.completions];
                newCompletions[existingIndex] = {
                  ...newCompletions[existingIndex],
                  status: completion.status,
                };
              } else {
                // Add new completion
                newCompletions = [
                  ...item.completions,
                  {
                    id: completion.id,
                    date: completion.date,
                    status: completion.status,
                  },
                ];
              }

              return {
                ...item,
                completions: newCompletions,
              };
            })
          );
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
      }
    },
    []
  );

  return (
    <RecurringWeeklyView
      items={items}
      onToggleCompletion={handleToggleCompletion}
      initialDate={initialDate}
      onDateChange={handleDateChange}
      showTaskNames={!singleTaskMode}
    />
  );
}
