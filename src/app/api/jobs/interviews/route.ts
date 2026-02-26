import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InterviewType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobApplicationId = searchParams.get("jobApplicationId");

    // Build where clause
    const where: { jobApplication: { userId: string }; jobApplicationId?: string } = {
      jobApplication: { userId: session.user.id },
    };

    if (jobApplicationId) {
      where.jobApplicationId = jobApplicationId;
    }

    const interviews = await prisma.jobInterview.findMany({
      where,
      include: {
        jobApplication: {
          select: {
            jobTitle: true,
            companyName: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Error fetching interviews:", error);
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
    if (!data.jobApplicationId || !data.interviewType || !data.roundNumber) {
      return NextResponse.json(
        { error: "Job application ID, interview type, and round number are required" },
        { status: 400 }
      );
    }

    // Validate interview type
    if (!Object.values(InterviewType).includes(data.interviewType)) {
      return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
    }

    // Check if job application exists and belongs to user
    const jobApplication = await prisma.jobApplication.findFirst({
      where: {
        id: data.jobApplicationId,
        userId: session.user.id,
      },
    });

    if (!jobApplication) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    // Parse dates
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const completedAt = data.completedAt ? new Date(data.completedAt) : null;

    const interview = await prisma.jobInterview.create({
      data: {
        jobApplicationId: data.jobApplicationId,
        interviewType: data.interviewType as InterviewType,
        roundNumber: data.roundNumber,
        scheduledAt,
        completedAt,
        notes: data.notes || null,
        location: data.location || null,
        interviewerNames: data.interviewerNames || null,
      },
      include: {
        jobApplication: {
          select: {
            jobTitle: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
    }

    // Check if interview exists and belongs to user
    const existingInterview = await prisma.jobInterview.findFirst({
      where: {
        id: data.id,
        jobApplication: { userId: session.user.id },
      },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Validate interview type if provided
    if (data.interviewType && !Object.values(InterviewType).includes(data.interviewType)) {
      return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.interviewType !== undefined) updateData.interviewType = data.interviewType;
    if (data.roundNumber !== undefined) updateData.roundNumber = data.roundNumber;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.interviewerNames !== undefined) updateData.interviewerNames = data.interviewerNames || null;

    const interview = await prisma.jobInterview.update({
      where: { id: data.id },
      data: updateData,
      include: {
        jobApplication: {
          select: {
            jobTitle: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
    }

    // Check if interview exists and belongs to user
    const existingInterview = await prisma.jobInterview.findFirst({
      where: {
        id,
        jobApplication: { userId: session.user.id },
      },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    await prisma.jobInterview.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
