import { Router } from "express";
import { db } from "@workspace/db";
import { pairsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post("/pairs", async (req, res): Promise<void> => {
  try {
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.select().from(pairsTable).where(eq(pairsTable.code, code));
      if (existing.length === 0) break;
      code = generateCode();
      attempts++;
    }

    const [pair] = await db.insert(pairsTable).values({ code }).returning();
    res.status(201).json({
      id: pair.id,
      code: pair.code,
      createdAt: pair.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create pair");
    res.status(500).json({ error: "Failed to create pair" });
  }
});

router.get("/pairs/:code", async (req, res): Promise<void> => {
  try {
    const { code } = req.params;
    const [pair] = await db.select().from(pairsTable).where(eq(pairsTable.code, code.toUpperCase()));
    if (!pair) {
      res.status(404).json({ error: "Pair not found" });
      return;
    }
    res.json({
      id: pair.id,
      code: pair.code,
      createdAt: pair.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get pair");
    res.status(500).json({ error: "Failed to get pair" });
  }
});

export default router;
