import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { OpenAI } from "openai";
import { prisma } from "../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const fullText = pdfData.text.trim();
    if (!fullText) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 400 });
    }

    // Send extracted text to OpenAI (optionally chunk if large)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Simple prompt for full curriculum generation
    const prompt = `
You are an expert curriculum designer. Based on the following textbook text, generate a curriculum with chapters, lessons, content, and quizzes in JSON:

${fullText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content;
    // Parse JSON response
    const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No JSON found in OpenAI response" }, { status: 500 });
    }

    const curriculum = JSON.parse(jsonMatch[0]);

    // Save curriculum and roadmap to database
    // (Adjust Prisma schema and saving logic as needed)

    // Dummy example for module
    const module = await prisma.module.create({
      data: {
        title: curriculum.chapters[0]?.title || "Untitled Module",
        teacherId: "dummy-teacher-id",
        curriculum: curriculum as any,
      },
    });

    return NextResponse.json({ success: true, module, curriculum });
  } catch (error: any) {
    console.error("Teacher upload error:", error);
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
