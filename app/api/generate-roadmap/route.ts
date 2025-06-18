// pages/api/generate-roadmap.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET(request: NextRequest) {
  try {
    const subject = request.nextUrl.searchParams.get('subject');
    
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject parameter is required' },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert curriculum designer. Create a detailed learning roadmap for ${subject} that will help students master the subject. The roadmap should be in JSON format with the following structure:

{
  "title": "Comprehensive ${subject} Learning Roadmap",
  "description": "A detailed guide to mastering ${subject}, covering fundamental concepts to advanced topics",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Detailed description of what this milestone covers",
      "tasks": [
        {
          "title": "Task title",
          "description": "Detailed description of the task",
          "resources": [
            "Resource 1",
            "Resource 2"
          ]
        }
      ]
    }
  ]
}

Requirements:
1. Create 4-6 major milestones that cover the entire subject
2. Each milestone should have 3-5 specific tasks
3. Each task should have 2-3 relevant resources
4. Make the content comprehensive and educational
5. Ensure logical progression from basic to advanced concepts
6. Include practical applications and real-world examples where relevant

Respond ONLY with valid JSON. Do not include any explanation or commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    let roadmap;
    try {
      roadmap = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing roadmap JSON:", e);
      throw new Error("Invalid roadmap format");
    }

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
