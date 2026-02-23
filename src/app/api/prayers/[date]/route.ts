import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";
import { getPrayersForDate } from "@/types/prayers";
import { PrayerStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date: dateParam } = await params;
    const date = parseISO(dateParam);

    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Get prayers for this date (respects Friday/Jumah logic)
    const prayersForDate = getPrayersForDate(date);

    // Get existing records
    const records = await prisma.prayerRecord.findMany({
      where: {
        userId: session.user.id,
        date,
      },
    });

    // Create a map for quick lookup
    const recordMap = new Map(records.map((r) => [r.prayer, r]));

    // Build response with all prayers for the day
    const prayers = prayersForDate.map((prayer) => ({
      prayer,
      record: recordMap.get(prayer) || null,
    }));

    return NextResponse.json({
      date: dateParam,
      prayers,
    });
  } catch (error) {
    console.error("Error fetching prayers for date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
