import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, isProjectOwner } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const access = await getProjectAccess(projectId, session.user.id);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get collaborators
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      owner: {
        ...project.user,
        role: "admin",
        isOwner: true,
      },
      collaborators: collaborators.map((c) => ({
        ...c.user,
        role: c.role,
        isOwner: false,
        collaborationId: c.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const access = await getProjectAccess(projectId, session.user.id);

    // Only project owner can add collaborators
    if (!isProjectOwner(access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role = "collaborator" } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    // Get project to check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Can't add owner as collaborator
    if (userToAdd.id === project.userId) {
      return NextResponse.json(
        { error: "Cannot add project owner as collaborator" },
        { status: 400 }
      );
    }

    // Can't add yourself
    if (userToAdd.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as collaborator" },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const existingCollaboration = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingCollaboration) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 400 }
      );
    }

    // Add collaborator
    const collaboration = await prisma.projectCollaborator.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: role === "admin" ? "admin" : "collaborator",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...collaboration.user,
      role: collaboration.role,
      isOwner: false,
      collaborationId: collaboration.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
