import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { getPrayersForDate } from "@/types/prayers";
import { PrayerType } from "@prisma/client";

// Webhook secret for authentication
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "dev-webhook-secret";

interface WebhookPayload {
  action: "populate-prayers";
  date?: string; // ISO date string, defaults to today
  userId?: string; // Optional: specific user, defaults to all users
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: WebhookPayload = await request.json();

    if (body.action !== "populate-prayers") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Get target date (default to today)
    const targetDate = body.date
      ? new Date(body.date)
      : new Date();

    // Reset time to start of day
    targetDate.setHours(0, 0, 0, 0);

    // Get prayers for this date (respects Friday/Jumah logic)
    const prayersForDate = getPrayersForDate(targetDate);

    // Get users to populate for
    const users = body.userId
      ? await prisma.user.findMany({ where: { id: body.userId } })
      : await prisma.user.findMany();

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
        created: 0,
      });
    }

    let created = 0;
    let skipped = 0;

    // Create prayer records for each user
    for (const user of users) {
      for (const prayer of prayersForDate) {
        // Check if record already exists
        const existing = await prisma.prayerRecord.findUnique({
          where: {
            userId_date_prayer: {
              userId: user.id,
              date: targetDate,
              prayer: prayer as PrayerType,
            },
          },
        });

        if (!existing) {
          await prisma.prayerRecord.create({
            data: {
              date: targetDate,
              prayer: prayer as PrayerType,
              status: "NO",
              userId: user.id,
            },
          });
          created++;
        } else {
          skipped++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Populated prayers for ${format(targetDate, "yyyy-MM-dd")}`,
      date: format(targetDate, "yyyy-MM-dd"),
      prayers: prayersForDate,
      usersProcessed: users.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error("Error in prayer webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
