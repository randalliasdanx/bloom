import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid curriculum ID" });
  }

  switch (req.method) {
    case "PATCH":
      try {
        const { title, curriculum } = req.body;
        const updateData: any = {};

        if (title && typeof title === "string") {
          updateData.title = title;
        }

        if (curriculum && typeof curriculum === "object") {
          updateData.curriculum = curriculum;
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No valid update data provided" });
        }

        const updatedModule = await prisma.module.update({
          where: { id },
          data: updateData,
        });

        res.status(200).json(updatedModule);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to update curriculum" });
      }
      break;

    case "DELETE":
      try {
        await prisma.module.delete({
          where: { id },
        });

        res.status(200).json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to delete curriculum" });
      }
      break;

    default:
      res.status(405).json({ error: "Method not allowed" });
  }
} 