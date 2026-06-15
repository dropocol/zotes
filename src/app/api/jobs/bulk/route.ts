import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  JobSource,
  ApplicationMethod,
  JobApplicationStatus,
  ResponseStatus,
} from "@prisma/client";

// Allowed fields for a bulk update. All are optional; only the ones
// present in the request body are applied.
interface BulkUpdateData {
  status?: JobApplicationStatus;
  responseReceived?: ResponseStatus;
  source?: JobSource;
  applicationMethod?: ApplicationMethod;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids: unknown = body.ids;
    const data: BulkUpdateData = body.data ?? {};

    // Validate ids
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json(
        { error: "ids must be a non-empty array of strings" },
        { status: 400 },
      );
    }

    // Validate any provided enum fields
    if (data.status !== undefined && !Object.values(JobApplicationStatus).includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (
      data.responseReceived !== undefined &&
      !Object.values(ResponseStatus).includes(data.responseReceived)
    ) {
      return NextResponse.json({ error: "Invalid responseReceived" }, { status: 400 });
    }
    if (data.source !== undefined && !Object.values(JobSource).includes(data.source)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }
    if (
      data.applicationMethod !== undefined &&
      !Object.values(ApplicationMethod).includes(data.applicationMethod)
    ) {
      return NextResponse.json({ error: "Invalid applicationMethod" }, { status: 400 });
    }

    // Build update payload from only the provided fields
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responseReceived !== undefined) updateData.responseReceived = data.responseReceived;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.applicationMethod !== undefined) updateData.applicationMethod = data.applicationMethod;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field to update must be provided" },
        { status: 400 },
      );
    }

    // Scoped to the session user so a user can't touch others' jobs.
    const result = await prisma.jobApplication.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error bulk updating job applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
