import { db } from "./db";
import { scores, inventory, upgrades } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import {
  type InsertScore,
  type Score,
  type Inventory,
  type InsertInventory,
  type Upgrade,
  type InsertUpgrade
} from "@shared/schema";

export interface IStorage {
  getScores(): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getInventory(walletAddress: string): Promise<Inventory | undefined>;
  upsertInventory(insertInventory: InsertInventory): Promise<Inventory>;
  getUpgrades(walletAddress: string): Promise<Upgrade | undefined>;
  upsertUpgrades(insertUpgrade: InsertUpgrade): Promise<Upgrade>;
}

export class DatabaseStorage implements IStorage {
  async getScores(): Promise<Score[]> {
    return db.select().from(scores).orderBy(desc(scores.score));
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const [row] = await db.insert(scores).values(insertScore).returning();
    return row;
  }

  async getInventory(walletAddress: string): Promise<Inventory | undefined> {
    const [row] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.walletAddress, walletAddress.toLowerCase()));
    return row;
  }

  async upsertInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const walletLower = insertInventory.walletAddress.toLowerCase();
    const [row] = await db
      .insert(inventory)
      .values({ ...insertInventory, walletAddress: walletLower })
      .onConflictDoUpdate({
        target: inventory.walletAddress,
        set: { potions: insertInventory.potions }
      })
      .returning();
    return row;
  }

  async getUpgrades(walletAddress: string): Promise<Upgrade | undefined> {
    const [row] = await db
      .select()
      .from(upgrades)
      .where(eq(upgrades.walletAddress, walletAddress.toLowerCase()));
    return row;
  }

  async upsertUpgrades(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const walletLower = insertUpgrade.walletAddress.toLowerCase();
    const [row] = await db
      .insert(upgrades)
      .values({ ...insertUpgrade, walletAddress: walletLower })
      .onConflictDoUpdate({
        target: upgrades.walletAddress,
        set: { stats: insertUpgrade.stats }
      })
      .returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
