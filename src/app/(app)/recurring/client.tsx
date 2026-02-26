"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { RecurringWeeklyView } from "@/components/recurring";
import { RecurringCompletionStatus, isSameDay, toUTCDate } from "@/types/recurring";

interface Completion {
  id: string;
  date: string;
  status: string;
}

interface RecurringItem {
  id: string;
  title: string;
  frequency?: string | null;
  daysOfWeek?: string | null;
  recurrenceStart?: string | null;
  recurrenceEnd?: string | null;
  completions: Completion[];
}

interface RecurringWeeklyViewClientProps {
  initialItems: RecurringItem[];
}

export function RecurringWeeklyViewClient({
  initialItems,
}: RecurringWeeklyViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RecurringItem[]>(initialItems);

  // Get initial date from URL or use today
  const dateParam = searchParams.get("date");
  const initialDate = dateParam ? toUTCDate(dateParam) : new Date();

  // Update URL when date changes
  const handleDateChange = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const url = new URL(window.location.href);
    url.searchParams.set("date", dateStr);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

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

              let newCompletions: Completion[];
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
    />
  );
}
