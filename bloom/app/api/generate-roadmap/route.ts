// pages/api/generate-roadmap.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfData = await pdfParse(buffer);

  const prompt = `Given the following textbook content, identify chapters and break them down into units with sub-topics (lessons). Format your response as a JSON roadmap with units, chapters, and lessons.

  ---
  ${pdfData.text.slice(0, 5000)}
  ---
  `;

  const gptRes = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4',
    temperature: 0.3
  });

  const roadmap = JSON.parse(gptRes.choices[0].message.content || '{}');
  return NextResponse.json({ roadmap });
}
