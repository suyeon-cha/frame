import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pairsTable } from "./pairs";

export const alarmsTable = pgTable("alarms", {
  id: serial("id").primaryKey(),
  pairId: integer("pair_id").notNull().references(() => pairsTable.id),
  label: text("label").notNull(),
  hour: integer("hour").notNull(),
  minute: integer("minute").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlarmSchema = createInsertSchema(alarmsTable).omit({ id: true, createdAt: true });
export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarmsTable.$inferSelect;
