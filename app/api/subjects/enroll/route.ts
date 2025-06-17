import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { subjectId, studentId } = await req.json();

  if (!subjectId || !studentId) {
    return NextResponse.json({ error: "Missing subject or student" }, { status: 400 });
  }

  try {
    await prisma.enrollment.create({
      data: {
        subjectId,
        studentId,
        progress: 0, // default progress
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Enrollment error:", err);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
