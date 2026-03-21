// NEW: src/app/api/company/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user?.companyId) return NextResponse.json({ error: "No company found" }, { status: 404 });

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
