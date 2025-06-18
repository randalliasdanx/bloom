import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { lessonName } = await request.json();
    if (!lessonName) {
      return NextResponse.json({ error: 'Missing lessonName' }, { status: 400 });
    }
    const prompt = `For the lesson titled "${lessonName}", provide:
1. 3-5 concise learning objectives (as a single string, comma-separated)
2. 3-5 core concepts (as a single string, comma-separated)
Format your response as JSON:
{
  "objectives": "...",
  "coreConcepts": "..."
}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    });
    const responseText = completion.choices[0].message.content;
    let objectives = '', coreConcepts = '';
    try {
      const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        objectives = parsed.objectives || '';
        coreConcepts = parsed.coreConcepts || '';
      }
    } catch (e) {}
    return NextResponse.json({ objectives, coreConcepts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
} 