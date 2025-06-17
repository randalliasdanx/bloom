// app/api/materials/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, contentUrl, subjectId } = body;

    const material = await prisma.material.create({
      data: {
        title,
        contentUrl,
        subjectId,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error saving material:", error);
    return NextResponse.json({ error: "Failed to save material" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  if (!subjectId) {
    return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
  }

  const materials = await prisma.material.findMany({
    where: { subjectId },
  });

   const formatted = materials.map((m) => ({
    id: m.id,
    title: m.title,
    link: m.contentUrl,
  }));

  return NextResponse.json(formatted);
}

export async function DELETE(req: Request) {
  try {
    const { id, filePath } = await req.json();

    const { error: storageError } = await supabase
      .storage
      .from("materials")
      .remove([filePath]);

    if (storageError) {
      console.error("Error removing from storage:", storageError);
      return new Response("Failed to delete from storage", { status: 500 });
    }

    await prisma.material.delete({
      where: { id },
    });

    return new Response("Deleted successfully", { status: 200 });
  } catch (err) {
    console.error("Error deleting material:", err);
    return new Response("Internal server error", { status: 500 });
  }
}