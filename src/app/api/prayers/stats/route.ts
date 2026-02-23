import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month"; // week, month, year, all

    let startDate: Date;
    const endDate = new Date();

    switch (range) {
      case "week":
        startDate = subDays(endDate, 7);
        break;
      case "month":
        startDate = startOfMonth(endDate);
        break;
      case "year":
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    const records = await prisma.prayerRecord.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate statistics
    const total = records.length;
    const prayed = records.filter((r) => r.status === "YES").length;
    const qazaa = records.filter((r) => r.status === "QAZAA").length;
    const missed = records.filter((r) => r.status === "NO").length;

    // Calculate by prayer type
    const byPrayer = {
      FAJR: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
      ZOHAR: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
      ASR: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
      MAGHRIB: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
      ISHA: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
      JUMAH: { total: 0, prayed: 0, qazaa: 0, missed: 0 },
    };

    records.forEach((record) => {
      const prayer = record.prayer as keyof typeof byPrayer;
      if (byPrayer[prayer]) {
        byPrayer[prayer].total++;
        if (record.status === "YES") byPrayer[prayer].prayed++;
        else if (record.status === "QAZAA") byPrayer[prayer].qazaa++;
        else byPrayer[prayer].missed++;
      }
    });

    // Calculate completion rate
    const completionRate = total > 0 ? Math.round((prayed / total) * 100) : 0;
    const qazaaRate = total > 0 ? Math.round((qazaa / total) * 100) : 0;

    return NextResponse.json({
      range,
      startDate,
      endDate,
      summary: {
        total,
        prayed,
        qazaa,
        missed,
        completionRate,
        qazaaRate,
      },
      byPrayer,
    });
  } catch (error) {
    console.error("Error fetching prayer stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
