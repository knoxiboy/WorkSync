import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { inviteCode } = body;
    
    if (!inviteCode) {
      return new NextResponse("Missing invite code", { status: 400 });
    }
    
    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          email: user.emailAddresses[0].emailAddress,
        }
      });
    }

    const company = await prisma.company.findUnique({
      where: { inviteCode }
    });

    if (!company) {
      return new NextResponse("Invalid invite code", { status: 404 });
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        companyId: company.id,
        role: "EMPLOYEE"
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
