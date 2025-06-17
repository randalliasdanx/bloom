import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { subject, roadmap } = await request.json();

    // Create or update the published roadmap
    const publishedRoadmap = await prisma.publishedRoadmap.upsert({
      where: {
        subject,
      },
      update: {
        roadmap,
      },
      create: {
        subject,
        roadmap,
      },
    });

    return NextResponse.json({ success: true, roadmap: publishedRoadmap });
  } catch (error) {
    console.error("Error publishing roadmap:", error);
    return NextResponse.json(
      { error: "Failed to publish roadmap" },
      { status: 500 }
    );
  }
} 