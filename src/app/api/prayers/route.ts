import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parseISO, startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import { PrayerType, PrayerStatus } from "@prisma/client";
import { getPrayersForDate } from "@/types/prayers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: { userId: string; date?: { gte: Date; lte: Date } } = {
      userId: session.user.id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: parseISO(startDate),
        lte: parseISO(endDate),
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

    const prayerDate = typeof date === "string" ? parseISO(date) : new Date(date);

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
