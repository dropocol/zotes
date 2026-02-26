import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobSource, ApplicationMethod, JobApplicationStatus, ResponseStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        interviews: {
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if job exists and belongs to user
    const existingJob = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    // Validate enums if provided
    if (data.source && !Object.values(JobSource).includes(data.source)) {
      return NextResponse.json({ error: "Invalid job source" }, { status: 400 });
    }

    if (data.applicationMethod && !Object.values(ApplicationMethod).includes(data.applicationMethod)) {
      return NextResponse.json({ error: "Invalid application method" }, { status: 400 });
    }

    if (data.status && !Object.values(JobApplicationStatus).includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (data.responseReceived && !Object.values(ResponseStatus).includes(data.responseReceived)) {
      return NextResponse.json({ error: "Invalid response status" }, { status: 400 });
    }

    // Parse dates
    const dateFound = data.dateFound !== undefined
      ? data.dateFound ? new Date(data.dateFound) : null
      : undefined;
    const dateApplied = data.dateApplied !== undefined
      ? data.dateApplied ? new Date(data.dateApplied) : null
      : undefined;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.applicationMethod !== undefined) updateData.applicationMethod = data.applicationMethod;
    if (data.jobPostingUrl !== undefined) updateData.jobPostingUrl = data.jobPostingUrl || null;
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin || null;
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax || null;
    if (data.salaryCurrency !== undefined) updateData.salaryCurrency = data.salaryCurrency;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.isRemote !== undefined) updateData.isRemote = data.isRemote;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responseReceived !== undefined) updateData.responseReceived = data.responseReceived;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (dateFound !== undefined) updateData.dateFound = dateFound;
    if (dateApplied !== undefined) updateData.dateApplied = dateApplied;

    const job = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: {
        interviews: {
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error updating job application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if job exists and belongs to user
    const existingJob = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    await prisma.jobApplication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
