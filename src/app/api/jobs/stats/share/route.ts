import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Manage the public, unguessable share link for the user's job stats page
 * (/share/[token]). POST creates or rotates the token, DELETE disables the
 * link. GET returns the current token so the UI can show the link state.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { shareToken: true },
  });

  return NextResponse.json({ shareToken: user?.shareToken ?? null });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 192 bits of entropy, URL-safe — effectively impossible to guess or brute force
  const shareToken = randomBytes(24).toString("base64url");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { shareToken },
  });

  return NextResponse.json({ shareToken });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { shareToken: null },
  });

  return NextResponse.json({ shareToken: null });
}
