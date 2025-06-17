//app/api/subjects/remove/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { subjectId, studentId } = await req.json();

  try {
    await prisma.enrollment.deleteMany({
      where: {
        subjectId,
        studentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to remove enrollment:", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
