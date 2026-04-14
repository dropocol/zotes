import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfMonth, format } from "date-fns";

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

    const jobs = await prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        dateApplied: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        interviews: true,
      },
    });

    // Calculate summary statistics
    const total = jobs.length;
    const byStatus = {
      saved: jobs.filter((j) => j.status === "SAVED").length,
      applied: jobs.filter((j) => j.status === "APPLIED").length,
      phoneScreen: jobs.filter((j) => j.status === "PHONE_SCREEN").length,
      interview: jobs.filter((j) => j.status === "INTERVIEW").length,
      offer: jobs.filter((j) => j.status === "OFFER").length,
      rejected: jobs.filter((j) => j.status === "REJECTED").length,
      withdrawn: jobs.filter((j) => j.status === "WITHDRAWN").length,
      noResponse: jobs.filter((j) => j.status === "NO_RESPONSE").length,
    };

    const bySource = {
      linkedin: jobs.filter((j) => j.source === "LINKEDIN").length,
      slack: jobs.filter((j) => j.source === "SLACK").length,
      facebook: jobs.filter((j) => j.source === "FACEBOOK").length,
      x: jobs.filter((j) => j.source === "X").length,
      companyWebsite: jobs.filter((j) => j.source === "COMPANY_WEBSITE").length,
      referral: jobs.filter((j) => j.source === "REFERRAL").length,
      jobBoard: jobs.filter((j) => j.source === "JOB_BOARD").length,
      other: jobs.filter((j) => j.source === "OTHER").length,
    };

    const byMethod = {
      email: jobs.filter((j) => j.applicationMethod === "EMAIL").length,
      webPortal: jobs.filter((j) => j.applicationMethod === "WEB_PORTAL").length,
      linkedinEasyApply: jobs.filter((j) => j.applicationMethod === "LINKEDIN_EASY_APPLY").length,
      referral: jobs.filter((j) => j.applicationMethod === "REFERRAL").length,
    };

    // Response rates
    const respondedYes = jobs.filter((j) => j.responseReceived === "YES").length;
    const respondedNo = jobs.filter((j) => j.responseReceived === "NO").length;
    const pending = jobs.filter((j) => j.responseReceived === "PENDING").length;
    const responseRate = total > 0 ? Math.round((respondedYes / total) * 100) : 0;

    // Interview stats
    const totalInterviews = jobs.reduce((sum, job) => sum + job.interviews.length, 0);
    const jobsWithInterviews = jobs.filter((j) => j.interviews.length > 0).length;
    const interviewRate = total > 0 ? Math.round((jobsWithInterviews / total) * 100) : 0;

    // Offer stats
    const offerRate = total > 0 ? Math.round((byStatus.offer / total) * 100) : 0;

    // Applications over time (by month)
    const applicationsOverTime: Record<string, number> = {};
    jobs.forEach((job) => {
      if (job.dateApplied) {
        const monthKey = format(job.dateApplied, "yyyy-MM");
        applicationsOverTime[monthKey] = (applicationsOverTime[monthKey] || 0) + 1;
      }
    });

    // Response rate by source
    const responseRateBySource: Record<string, { total: number; responded: number; rate: number }> = {};
    jobs.forEach((job) => {
      if (!responseRateBySource[job.source]) {
        responseRateBySource[job.source] = { total: 0, responded: 0, rate: 0 };
      }
      responseRateBySource[job.source].total++;
      if (job.responseReceived === "YES") {
        responseRateBySource[job.source].responded++;
      }
    });

    // Calculate rates
    Object.keys(responseRateBySource).forEach((source) => {
      const data = responseRateBySource[source];
      data.rate = data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0;
    });

    return NextResponse.json({
      range,
      startDate,
      endDate,
      summary: {
        total,
        responseRate,
        interviewRate,
        offerRate,
        respondedYes,
        respondedNo,
        pending,
        totalInterviews,
        jobsWithInterviews,
      },
      byStatus,
      bySource,
      byMethod,
      applicationsOverTime,
      responseRateBySource,
    });
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
