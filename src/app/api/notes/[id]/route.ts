import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, canViewProject, canModifyProject } from "@/lib/permissions";

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

    // Find note owned by user or in a collaborated project
    const note = await prisma.note.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Determine user role for the project
    let userRole: "admin" | "collaborator" | null = null;
    let isOwner = note.userId === session.user.id;

    if (note.projectId) {
      const access = await getProjectAccess(note.projectId, session.user.id);
      userRole = access.role;
      isOwner = access.isOwner || isOwner;
    } else {
      userRole = isOwner ? "admin" : null;
    }

    return NextResponse.json({
      ...note,
      userRole,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
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
    const { title, content, projectId, pinned } = await request.json();

    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if user can modify (only owner of note or admin of project)
    const isNoteOwner = existingNote.userId === session.user.id;
    let canModify = isNoteOwner;

    if (existingNote.projectId) {
      const access = await getProjectAccess(existingNote.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: title ?? existingNote.title,
        content: content ?? existingNote.content,
        projectId: projectId !== undefined ? projectId : existingNote.projectId,
        pinned: pinned !== undefined ? pinned : existingNote.pinned,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
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

    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { project: { collaborators: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if user can modify (only owner of note or admin of project)
    const isNoteOwner = existingNote.userId === session.user.id;
    let canModify = isNoteOwner;

    if (existingNote.projectId) {
      const access = await getProjectAccess(existingNote.projectId, session.user.id);
      canModify = canModifyProject(access);
    }

    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
