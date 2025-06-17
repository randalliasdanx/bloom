// app/api/students/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  
  try {
    const students = await prisma.student.findMany({
      where: teacherId
        ? {
            teachers: {
              some: { id: teacherId },
            },
          }
        : undefined, // fallback to all students if no teacherId provided
      include: {
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Transform to match frontend shape
    const transformed = students.map((s) => ({
      id: s.id,
      name: s.name,
      username: s.username,
      imageUrl: s.imageUrl,
      preferences: s.preferences,
      enrolled: s.enrollments.map((e) => ({
        name: e.subject.name,
        progress: e.progress ?? 0,
      })),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { name, username, preferences } = await req.json();

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const student = await prisma.student.create({
    data: { name, username, preferences },
  });

  return NextResponse.json(student);
}
