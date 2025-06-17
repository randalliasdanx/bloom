// app/api/teacher/remove-student/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { teacherId, studentId } = await req.json();

    if (!teacherId || !studentId) {
      return NextResponse.json({ error: "Missing teacherId or studentId" }, { status: 400 });
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove student:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
