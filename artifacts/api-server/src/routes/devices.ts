import { Router } from "express";
import { db } from "@workspace/db";
import { devicesTable, pairsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/devices", async (req, res): Promise<void> => {
  try {
    const { pairCode, role } = req.body as { pairCode: string; role: string };

    if (!pairCode || !role) {
      res.status(400).json({ error: "pairCode and role are required" });
      return;
    }

    if (role !== "primary" && role !== "secondary") {
      res.status(400).json({ error: "role must be primary or secondary" });
      return;
    }

    const [pair] = await db
      .select()
      .from(pairsTable)
      .where(eq(pairsTable.code, pairCode.toUpperCase()));

    if (!pair) {
      res.status(404).json({ error: "Pair not found" });
      return;
    }

    const [device] = await db
      .insert(devicesTable)
      .values({ pairId: pair.id, role })
      .returning();

    res.status(201).json({
      id: device.id,
      pairId: device.pairId,
      role: device.role,
      createdAt: device.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to register device");
    res.status(500).json({ error: "Failed to register device" });
  }
});

export default router;
