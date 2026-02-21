import { prisma } from "@/lib/prisma";

export interface ProjectAccess {
  hasAccess: boolean;
  role: "admin" | "collaborator" | null;
  isOwner: boolean;
}

/**
 * Get user's access level for a project
 * Returns access info including role and ownership status
 */
export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  // User is the owner
  if (project && project.userId === userId) {
    return {
      hasAccess: true,
      role: "admin",
      isOwner: true,
    };
  }

  // Check if user is a collaborator
  const collaboration = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: { role: true },
  });

  if (collaboration) {
    return {
      hasAccess: true,
      role: collaboration.role as "admin" | "collaborator",
      isOwner: false,
    };
  }

  return {
    hasAccess: false,
    role: null,
    isOwner: false,
  };
}

/**
 * Check if user can view the project
 * Both admin and collaborators can view
 */
export function canViewProject(access: ProjectAccess): boolean {
  return access.hasAccess;
}

/**
 * Check if user can modify the project
 * Only admin (owner or admin collaborator) can modify
 */
export function canModifyProject(access: ProjectAccess): boolean {
  return access.hasAccess && access.role === "admin";
}

/**
 * Check if user is the project owner
 * Only owners can delete projects and manage collaborators
 */
export function isProjectOwner(access: ProjectAccess): boolean {
  return access.isOwner;
}
