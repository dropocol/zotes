import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadStatus, LeadType } from "@prisma/client";

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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
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

    // Check if lead exists and belongs to user
    const existingLead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Validate status enum if provided
    if (data.status && !Object.values(LeadStatus).includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate type enum if provided
    if (data.type && !Object.values(LeadType).includes(data.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.company !== undefined) updateData.company = data.company || null;
    if (data.title !== undefined) updateData.title = data.title || null;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.createdAt !== undefined) updateData.createdAt = data.createdAt ? new Date(data.createdAt) : existingLead.createdAt;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
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

    // Check if lead exists and belongs to user
    const existingLead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
