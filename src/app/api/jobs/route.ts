import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobSource, ApplicationMethod, JobApplicationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    // Build where clause
    const where: {
      userId: string;
      status?: JobApplicationStatus;
      source?: JobSource;
      OR?: Array<{
        jobTitle?: { contains: string; mode: "insensitive" };
        companyName?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      userId: session.user.id,
    };

    if (status && Object.values(JobApplicationStatus).includes(status as JobApplicationStatus)) {
      where.status = status as JobApplicationStatus;
    }

    if (source && Object.values(JobSource).includes(source as JobSource)) {
      where.source = source as JobSource;
    }

    if (search) {
      where.OR = [
        { jobTitle: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const jobs = await prisma.jobApplication.findMany({
      where,
      include: {
        interviews: {
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching job applications:", error);
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

    const data = await request.json();

    // Validate required fields
    if (!data.jobTitle || !data.companyName || !data.source || !data.applicationMethod) {
      return NextResponse.json(
        { error: "Job title, company name, source, and application method are required" },
        { status: 400 }
      );
    }

    // Validate enums
    if (!Object.values(JobSource).includes(data.source)) {
      return NextResponse.json({ error: "Invalid job source" }, { status: 400 });
    }

    if (!Object.values(ApplicationMethod).includes(data.applicationMethod)) {
      return NextResponse.json({ error: "Invalid application method" }, { status: 400 });
    }

    if (data.status && !Object.values(JobApplicationStatus).includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Parse dates
    const dateFound = data.dateFound ? new Date(data.dateFound) : null;
    const dateApplied = data.dateApplied ? new Date(data.dateApplied) : null;

    const job = await prisma.jobApplication.create({
      data: {
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        source: data.source as JobSource,
        applicationMethod: data.applicationMethod as ApplicationMethod,
        jobPostingUrl: data.jobPostingUrl || null,
        salaryMin: data.salaryMin || null,
        salaryMax: data.salaryMax || null,
        salaryCurrency: data.salaryCurrency || "USD",
        location: data.location || null,
        isRemote: data.isRemote ?? false,
        status: data.status || "SAVED",
        responseReceived: data.responseReceived || "PENDING",
        notes: data.notes || null,
        dateFound,
        dateApplied,
        userId: session.user.id,
      },
      include: {
        interviews: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error creating job application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
