import { Router } from "express";
import { db } from "@workspace/db";
import { alarmsTable, pairsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/alarms", async (req, res): Promise<void> => {
  try {
    const { pairCode } = req.query as { pairCode?: string };
    if (!pairCode) {
      res.status(400).json({ error: "pairCode query parameter is required" });
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

    const alarms = await db
      .select()
      .from(alarmsTable)
      .where(eq(alarmsTable.pairId, pair.id))
      .orderBy(alarmsTable.createdAt);

    res.json(
      alarms.map((a) => ({
        id: a.id,
        pairId: a.pairId,
        label: a.label,
        hour: a.hour,
        minute: a.minute,
        enabled: a.enabled,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list alarms");
    res.status(500).json({ error: "Failed to list alarms" });
  }
});

router.post("/alarms", async (req, res): Promise<void> => {
  try {
    const { pairCode, label, hour, minute } = req.body as {
      pairCode: string;
      label: string;
      hour: number;
      minute: number;
    };

    if (!pairCode || label === undefined || hour === undefined || minute === undefined) {
      res.status(400).json({ error: "pairCode, label, hour, and minute are required" });
      return;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      res.status(400).json({ error: "hour must be 0-23 and minute must be 0-59" });
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

    const [alarm] = await db
      .insert(alarmsTable)
      .values({
        pairId: pair.id,
        label,
        hour,
        minute,
        enabled: true,
      })
      .returning();

    res.status(201).json({
      id: alarm.id,
      pairId: alarm.pairId,
      label: alarm.label,
      hour: alarm.hour,
      minute: alarm.minute,
      enabled: alarm.enabled,
      createdAt: alarm.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create alarm");
    res.status(500).json({ error: "Failed to create alarm" });
  }
});

router.patch("/alarms/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid alarm id" });
      return;
    }

    const { label, hour, minute, enabled } = req.body as {
      label?: string;
      hour?: number;
      minute?: number;
      enabled?: boolean;
    };

    const [existing] = await db
      .select()
      .from(alarmsTable)
      .where(eq(alarmsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Alarm not found" });
      return;
    }

    const updates: Partial<typeof alarmsTable.$inferInsert> = {};
    if (label !== undefined) updates.label = label;
    if (hour !== undefined) updates.hour = hour;
    if (minute !== undefined) updates.minute = minute;
    if (enabled !== undefined) updates.enabled = enabled;

    const [updated] = await db
      .update(alarmsTable)
      .set(updates)
      .where(eq(alarmsTable.id, id))
      .returning();

    res.json({
      id: updated.id,
      pairId: updated.pairId,
      label: updated.label,
      hour: updated.hour,
      minute: updated.minute,
      enabled: updated.enabled,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update alarm");
    res.status(500).json({ error: "Failed to update alarm" });
  }
});

router.delete("/alarms/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid alarm id" });
      return;
    }

    const [existing] = await db
      .select()
      .from(alarmsTable)
      .where(eq(alarmsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Alarm not found" });
      return;
    }

    await db.delete(alarmsTable).where(eq(alarmsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete alarm");
    res.status(500).json({ error: "Failed to delete alarm" });
  }
});

export default router;
