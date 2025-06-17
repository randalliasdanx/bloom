import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import { OpenAI } from "openai";
import { prisma } from "../../lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface Curriculum {
  chapters: any[];
}

function parseForm(req: NextApiRequest): Promise<{ files: formidable.Files; fields: formidable.Fields }> {
  const form = new formidable.IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let extractedText = "";
    let textChunks: string[] = [];
    let textbookOrSubject = "Untitled Textbook/Subject";
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const { files, fields } = await parseForm(req);
      if (!files.pdf) {
        return res.status(400).json({ error: "No PDF uploaded" });
      }
      const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;

      if (!("filepath" in pdfFile)) {
        return res.status(400).json({ error: "Invalid PDF file" });
      }

      const fs = await import("fs/promises");
      const buffer = await fs.readFile(pdfFile.filepath);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text.trim();

      if (!extractedText) {
        return res.status(400).json({ error: "No text extracted from PDF" });
      }
      if (fields.textbookOrSubject && Array.isArray(fields.textbookOrSubject) && fields.textbookOrSubject[0]) {
        textbookOrSubject = fields.textbookOrSubject[0].trim();
      }
    } else if (contentType.includes("application/json")) {
      const buffers: Buffer[] = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = Buffer.concat(buffers).toString();
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed.textChunks)) {
        textChunks = parsed.textChunks;
      } else if (typeof parsed.text === "string") {
        textChunks = [parsed.text];
      }
      if (textChunks.length === 0) {
        return res.status(400).json({ error: "No text provided in JSON" });
      }
      if (parsed.textbookOrSubject && typeof parsed.textbookOrSubject === "string") {
        textbookOrSubject = parsed.textbookOrSubject.trim();
      }
    } else {
      return res.status(400).json({ error: "Unsupported content type" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    async function processChunk(chunk: string): Promise<any[]> {
      const prompt = `
You are an expert university-level curriculum designer. Given the following section from a university textbook, generate a thorough and detailed curriculum in JSON format. The curriculum should be suitable for university students and include:

- An array of "chapters", each with:
  - "title": The chapter title MUST be in the format "Chapter X: [Chapter Name]" where X is a number (e.g., "Chapter 1: Introduction to ...")
  - "content": A detailed summary or main content for the chapter
  - "lessons": An array of lessons, each with:
    - "title": The lesson title
    - "content": A thorough explanation of the lesson topic
  - "quiz": An array of quiz questions, each with:
    - "question": The quiz question
    - "options": An array of possible answers
    - "answer": The correct answer

IMPORTANT: 
1. Chapter titles MUST follow the format "Chapter X: [Chapter Name]" where X is a number
2. Chapters MUST be numbered sequentially starting from 1
3. Do not skip numbers in chapter sequence
4. If the content suggests multiple chapters, number them 1, 2, 3, etc.
5. Each chapter MUST have a unique title and content
6. Do not duplicate chapter numbers or titles

If the content is not enough for a full chapter, extract as much as you can (lessons, summaries, or quiz questions). The curriculum should be as comprehensive, clear, and educational as possible for any university-level subject (math, science, humanities, engineering, etc.).

Respond ONLY with valid JSON. Do not include any explanation or commentary.

Example:
{
  "chapters": [
    {
      "title": "Chapter 1: [Chapter Name]",
      "content": "[Chapter summary or main content]",
      "lessons": [
        {
          "title": "Lesson 1: [Lesson Name]",
          "content": "[Lesson content]"
        }
      ],
      "quiz": [
        {
          "question": "[Quiz question]",
          "options": ["A", "B", "C", "D"],
          "answer": "A"
        }
      ]
    }
  ]
}

Textbook content:
${chunk}
`;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1500,
        });
        const responseText = completion.choices[0].message.content;
        if (!responseText) return [];
        
        let chapters: any[] = [];
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const curriculum: Curriculum = JSON.parse(jsonMatch[0]);
            if (Array.isArray(curriculum.chapters) && curriculum.chapters.length > 0) {
              chapters = curriculum.chapters;
            }
          }
        } catch (e) {
          console.error("Error parsing chapters:", e);
        }

        return chapters;
      } catch (e) {
        console.error("OpenAI error for chunk:", e);
        return [];
      }
    }

    const chunkPromises = textChunks.map(chunk => processChunk(chunk));
    const chunkResults = await Promise.all(chunkPromises);
    
    // Combine all chapters and remove duplicates based on content
    const uniqueChapters = chunkResults
      .flat()
      .filter(Boolean)
      .filter((chapter, index, self) =>
        index === self.findIndex((c) => 
          c.content === chapter.content || 
          c.title.replace(/^Chapter\s+\d+:\s*/i, '').trim() === 
          chapter.title.replace(/^Chapter\s+\d+:\s*/i, '').trim()
        )
      );

    // Sort chapters by their original number if present, otherwise by content length
    uniqueChapters.sort((a, b) => {
      const numA = parseInt(a.title.match(/Chapter\s+(\d+)/i)?.[1] || '0');
      const numB = parseInt(b.title.match(/Chapter\s+(\d+)/i)?.[1] || '0');
      if (numA && numB) return numA - numB;
      return b.content.length - a.content.length;
    });

    // Ensure final chapter ordering with correct sequential numbers
    const finalChapters = uniqueChapters.map((chapter, index) => {
      const chapterNumber = index + 1;
      // Extract the title without the chapter number
      const titleWithoutNumber = chapter.title
        .replace(/^Chapter\s+\d+:\s*/i, '')
        .trim();
      
      // Create new chapter object with correct number
      return {
        ...chapter,
        title: `Chapter ${chapterNumber}: ${titleWithoutNumber}`
      };
    });

    console.log('Final chapters:', finalChapters.map(c => c.title));

    if (finalChapters.length === 0) {
      return res.status(500).json({ error: "No curriculum chapters generated from OpenAI" });
    }

    // Ensure at least one teacher exists, or create a default one
    let teacher = await prisma.teacher.findFirst();
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          email: "default-teacher@example.com",
          name: "Default Teacher",
          password: "changeme123", // In production, hash and secure this!
        },
      });
    }

    const module = await prisma.module.create({
      data: {
        title: finalChapters[0]?.title || "Untitled Module",
        teacherId: teacher.id,
        curriculum: { chapters: finalChapters },
        textbookOrSubject: textbookOrSubject || "Untitled Textbook/Subject",
      },
    });

    res.status(200).json({ success: true, module, curriculum: { chapters: finalChapters } });
  } catch (error: any) {
    console.error("Teacher upload error:", error);
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
}
