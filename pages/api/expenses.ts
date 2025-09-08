import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const expenses = await prisma.expense.findMany({
        orderBy: { date: "desc" },
      });
      return res.status(200).json(expenses);
    }

    if (req.method === "POST") {
      const { amount, note, category, date } = req.body;

      if (!amount || !category || !date) {
        return res.status(400).json({ error: "amount, category and date are required" });
      }

      const parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0); // normalize to start of day

      const expense = await prisma.expense.create({
        data: {
          amount: Number(amount),
          note: note || null,
          category,
          date: parsedDate,
        },
      });

      return res.status(201).json(expense);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
