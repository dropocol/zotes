import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeJobStats, parseStatsRange } from "@/lib/job-stats";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = parseStatsRange(searchParams.get("range"));

    const jobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      include: { interviews: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(computeJobStats(jobs, range));
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
