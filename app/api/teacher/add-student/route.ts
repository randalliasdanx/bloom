// app/api/teacher/add-student/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { teacherId, username } = await req.json();

    if (!teacherId || !username) {
      return NextResponse.json({ error: "Missing teacherId or username" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { username },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        students: {
          connect: { id: student.id },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add student:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
