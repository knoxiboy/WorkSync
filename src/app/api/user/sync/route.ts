import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import { randomBytes } from "crypto";

// Simple cuid-like generator for IDs
const createId = () => randomBytes(12).toString('hex');

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const dbUsers = await sql`SELECT * FROM "User" WHERE "clerkId" = ${userId} LIMIT 1`;
    let dbUser = dbUsers[0];

    if (!dbUser) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
      const email = user.emailAddresses[0].emailAddress;
      const newUsers = await sql`
        INSERT INTO "User" ("id", "clerkId", "name", "email", "createdAt")
        VALUES (${createId()}, ${userId}, ${name}, ${email}, NOW())
        RETURNING *
      `;
      dbUser = newUsers[0];
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("[USER_SYNC]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
