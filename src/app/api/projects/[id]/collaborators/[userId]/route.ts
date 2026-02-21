import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, isProjectOwner } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId: collaboratorUserId } = await params;
    const access = await getProjectAccess(projectId, session.user.id);

    // Only project owner can remove collaborators
    if (!isProjectOwner(access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find and delete the collaboration
    const collaboration = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: collaboratorUserId,
        },
      },
    });

    if (!collaboration) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    await prisma.projectCollaborator.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: collaboratorUserId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
