import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid module ID" });
  }
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { roadmap } = req.body;
    if (!roadmap) {
      return res.status(400).json({ error: "Missing roadmap" });
    }
    const updated = await prisma.module.update({
      where: { id },
      data: { roadmap },
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update roadmap" });
  }
} 