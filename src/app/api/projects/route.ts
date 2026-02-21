import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get projects owned by user
    const ownedProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { notes: true, todoLists: true },
        },
      },
    });

    // Get projects where user is a collaborator
    const collaborations = await prisma.projectCollaborator.findMany({
      where: { userId: session.user.id },
      include: {
        project: {
          include: {
            _count: {
              select: { notes: true, todoLists: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Combine and mark role
    const projects = [
      ...ownedProjects.map((p) => ({ ...p, userRole: "admin", isOwner: true })),
      ...collaborations.map((c) => ({
        ...c.project,
        userRole: c.role,
        isOwner: false,
      })),
    ];

    // Sort by updatedAt
    projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
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

    const { name, description, color } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
