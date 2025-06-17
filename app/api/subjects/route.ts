import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
      },
    });

    // Transform into the format SubjectList expects
    const formatted = subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      enrolled: subject.enrollments.map((enroll) => ({
        id: enroll.student.id,
        name: enroll.student.name,
        progress: enroll.progress ?? 0,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Failed to fetch subjects", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST handler to create subject
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, teacherId } = body;

    if (!name || !teacherId) {
      return NextResponse.json({ error: "Missing name or teacherId" }, { status: 400 });
    }

    const newSubject = await prisma.subject.create({
      data: {
        name,
        teacher: { connect: { id: teacherId } },
      },
    });

    return NextResponse.json(newSubject);
  } catch (err) {
    console.error("Failed to create subject:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
