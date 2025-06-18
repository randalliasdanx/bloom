import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const modules = await prisma.module.findMany({
      select: {
        id: true,
        title: true,
        curriculum: true,
        textbookOrSubject: true,
      },
      orderBy: { title: "asc" },
    });
    res.status(200).json({ modules });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
} 