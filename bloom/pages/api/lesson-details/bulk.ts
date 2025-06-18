import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { moduleId, lessonDetails } = req.body;
    if (!moduleId || !lessonDetails) {
      return res.status(400).json({ error: "Missing moduleId or lessonDetails" });
    }
    // For simplicity, store lessonDetails as a JSON field on the module
    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: { lessonDetails },
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update lesson details" });
  }
} 