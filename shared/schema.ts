import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  wave: integer("wave").notNull().default(1),
  enemiesDefeated: integer("enemies_defeated").notNull(),
  playTime: integer("play_time").notNull().default(0), // Time in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  potions: jsonb("potions").notNull().default({
    health: 0,
    ki: 0,
    immunity: 0,
    score: 0
  }),
});

export const upgrades = pgTable("upgrades", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  stats: jsonb("stats").notNull().default({
    health: 0,
    damage: 0,
    speed: 0,
    ki: 0
  }),
});

export const insertScoreSchema = createInsertSchema(scores).omit({ id: true, createdAt: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true });
export const insertUpgradeSchema = createInsertSchema(upgrades).omit({ id: true });

export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Upgrade = typeof upgrades.$inferSelect;
export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
