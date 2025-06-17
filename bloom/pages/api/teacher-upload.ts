// pages/api/teacher-upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import { OpenAI } from "openai";
import { prisma } from "../../lib/prisma"; // adjust path if needed

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle multipart/form-data manually
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
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let extractedText = "";
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle raw PDF upload
      const { files } = await parseForm(req);
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
    } else if (contentType.includes("application/json")) {
      // Handle JSON payload with extracted text
      const buffers: Buffer[] = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = Buffer.concat(buffers).toString();
      const parsed = JSON.parse(body);
      extractedText = (parsed.text || "").trim();

      if (!extractedText) {
        return res.status(400).json({ error: "No text provided in JSON" });
      }
    } else {
      return res.status(400).json({ error: "Unsupported content type" });
    }

    // Now send extractedText to OpenAI to generate curriculum
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an expert curriculum designer. Given this textbook content, generate a JSON curriculum with chapters, lessons, and quizzes:

${extractedText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      return res.status(500).json({ error: "No response from OpenAI" });
    }
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: "No JSON found in OpenAI response" });
    }

    const curriculum: Curriculum = JSON.parse(jsonMatch[0]);

    // Save to DB (adjust this part according to your Prisma schema)
    const module = await prisma.module.create({
      data: {
        title: curriculum.chapters[0]?.title || "Untitled Module",
        teacherId: "dummy-teacher-id", // TODO: replace with actual teacher id
        curriculum: curriculum as any,
      },
    });

    res.status(200).json({ success: true, module, curriculum });
  } catch (error: any) {
    console.error("Teacher upload error:", error);
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
}
