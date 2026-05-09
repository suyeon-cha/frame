import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pairsTable = pgTable("pairs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPairSchema = createInsertSchema(pairsTable).omit({ id: true, createdAt: true });
export type InsertPair = z.infer<typeof insertPairSchema>;
export type Pair = typeof pairsTable.$inferSelect;
