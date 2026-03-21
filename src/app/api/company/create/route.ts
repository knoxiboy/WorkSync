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
    const { name } = body;
    
    if (!name) {
      return new NextResponse("Missing name", { status: 400 });
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

    const company = await prisma.company.create({
      data: {
        name,
      }
    });

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        companyId: company.id,
        role: "MANAGER"
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
