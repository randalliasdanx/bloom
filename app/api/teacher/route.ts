// app/api/teacher/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("API HIT: /api/teacher");

    const teacher = await prisma.teacher.findUnique({
      where: { username: "ilovemovienight" },
    });

    if (!teacher) {
      console.warn("No teacher found for username 'ilovemovienight'");
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    console.log("Returning teacher:", teacher);
    return NextResponse.json(teacher);
  } catch (err) {
    console.error("Error fetching teacher:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

