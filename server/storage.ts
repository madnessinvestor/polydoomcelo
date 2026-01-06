import { db } from "./db";
import {
  scores,
  inventory,
  type InsertScore,
  type Score,
  type Inventory,
  type InsertInventory
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getScores(): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getInventory(walletAddress: string): Promise<Inventory | undefined>;
  upsertInventory(insertInventory: InsertInventory): Promise<Inventory>;
}

export class DatabaseStorage implements IStorage {
  async getScores(): Promise<Score[]> {
    return await db.select().from(scores).orderBy(desc(scores.score)).limit(10);
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const [score] = await db.insert(scores).values(insertScore).returning();
    return score;
  }

  async getInventory(walletAddress: string): Promise<Inventory | undefined> {
    const [userInventory] = await db.select().from(inventory).where(eq(inventory.walletAddress, walletAddress));
    return userInventory;
  }

  async upsertInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [existing] = await db.select().from(inventory).where(eq(inventory.walletAddress, insertInventory.walletAddress));
    
    if (existing) {
      const [updated] = await db.update(inventory)
        .set({ potions: insertInventory.potions })
        .where(eq(inventory.walletAddress, insertInventory.walletAddress))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(inventory).values(insertInventory).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
