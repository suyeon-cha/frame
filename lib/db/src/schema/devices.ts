import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pairsTable } from "./pairs";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  pairId: integer("pair_id").notNull().references(() => pairsTable.id),
  role: text("role").notNull(), // 'primary' | 'secondary'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
