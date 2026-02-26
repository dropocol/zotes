import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parseISO, startOfMonth, endOfMonth, subDays, addDays, startOfDay, getDay, differenceInDays } from "date-fns";
import { PrayerType, PrayerStatus } from "@prisma/client";

/**
 * Get the prayers for a specific date, respecting Friday/Jumah logic
 */
function getPrayersForDate(date: Date): PrayerType[] {
  const dayOfWeek = getDay(date);
  const isFriday = dayOfWeek === 5;

  return [
    PrayerType.FAJR,
    isFriday ? PrayerType.JUMAH : PrayerType.ZOHAR,
    PrayerType.ASR,
    PrayerType.MAGHRIB,
    PrayerType.ISHA,
  ];
}

/**
 * Ensure prayers exist for a specific date
 * Returns true if any new records were created
 */
async function ensurePrayersForDate(
  userId: string,
  date: Date
): Promise<boolean> {
  const dayStart = startOfDay(date);
  const prayers = getPrayersForDate(dayStart);

  // Check which prayers already exist
  const existingRecords = await prisma.prayerRecord.findMany({
    where: {
      userId,
      date: dayStart,
    },
    select: { prayer: true },
  });

  const existingPrayers = new Set(existingRecords.map((r) => r.prayer));
  const toCreate = prayers.filter((p) => !existingPrayers.has(p));

  if (toCreate.length > 0) {
    await prisma.prayerRecord.createMany({
      data: toCreate.map((prayer) => ({
        date: dayStart,
        prayer,
        status: "NO",
        userId,
      })),
      skipDuplicates: true,
    });
  }

  return toCreate.length > 0;
}

/**
 * Ensure prayers exist for a date range
 * Useful when user hasn't opened the app in a while
 */
async function ensurePrayersForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const daysDiff = differenceInDays(end, start);

  // Process each day in the range
  // Limit to 90 days to prevent excessive operations
  const maxDays = 90;
  const daysToProcess = Math.min(daysDiff, maxDays);

  for (let i = 0; i <= daysToProcess; i++) {
    const currentDate = addDays(start, i);
    // Only populate past dates and today, not future dates
    if (currentDate <= startOfDay(new Date())) {
      await ensurePrayersForDate(userId, currentDate);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const populate = searchParams.get("populate") !== "false"; // Default to true

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = parseISO(startDate);
      end = parseISO(endDate);

      // Populate missing prayers in the date range
      if (populate) {
        await ensurePrayersForDateRange(session.user.id, start, end);
      }
    }

    // Build where clause
    const where: { userId: string; date?: { gte: Date; lte: Date } } = {
      userId: session.user.id,
    };

    if (start && end) {
      where.date = {
        gte: start,
        lte: end,
      };
    }

    const records = await prisma.prayerRecord.findMany({
      where,
      orderBy: [{ date: "asc" }, { prayer: "asc" }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching prayer records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, prayer, status } = await request.json();

    if (!date || !prayer || !status) {
      return NextResponse.json(
        { error: "Date, prayer, and status are required" },
        { status: 400 }
      );
    }

    // Validate prayer type
    if (!Object.values(PrayerType).includes(prayer)) {
      return NextResponse.json(
        { error: "Invalid prayer type" },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(PrayerStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid prayer status" },
        { status: 400 }
      );
    }

    // Parse date string and set to noon UTC to avoid timezone day-shifting issues
    // "2026-02-24" should be stored as Feb 24, not shifted by timezone
    const prayerDate = typeof date === "string"
      ? new Date(date + "T12:00:00Z") // Use noon UTC to avoid day boundary issues
      : new Date(date);

    // Upsert the prayer record
    const record = await prisma.prayerRecord.upsert({
      where: {
        userId_date_prayer: {
          userId: session.user.id,
          date: prayerDate,
          prayer: prayer as PrayerType,
        },
      },
      update: {
        status: status as PrayerStatus,
      },
      create: {
        date: prayerDate,
        prayer: prayer as PrayerType,
        status: status as PrayerStatus,
        userId: session.user.id,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error upserting prayer record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
