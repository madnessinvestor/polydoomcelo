import { supabase } from "./supabase";
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
    try {
      // Usando a tabela 'scores' conforme sugerido, já que ela é a que parece existir no cache
      const { data, error } = await supabase
        .from("scores")
        .select("id, player_name, score, enemies_defeated, play_time, created_at")
        .order("score", { ascending: false });

      if (error) {
        console.error("Supabase getScores error (scores):", error);
        return [];
      }
      
      return (data || []).map((s: any) => ({
        id: s.id,
        playerName: s.player_name || s.wallet || "Anonymous",
        score: Number(s.score) || 0,
        wave: 1,
        enemiesDefeated: Number(s.enemies_defeated) || 0,
        playTime: Number(s.play_time) || 0,
        createdAt: s.created_at
      }));
    } catch (err) {
      console.error("Error in getScores:", err);
      return [];
    }
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    try {
      const { data, error } = await supabase
        .from("scores")
        .insert({
          player_name: insertScore.playerName,
          score: insertScore.score,
          enemies_defeated: insertScore.enemiesDefeated,
          play_time: insertScore.playTime
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        playerName: data.player_name,
        enemiesDefeated: data.enemies_defeated,
        playTime: data.play_time,
        wave: 1
      };
    } catch (err) {
      console.error("Error in createScore:", err);
      throw err;
    }
  }

  async getInventory(walletAddress: string): Promise<Inventory | undefined> {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("wallet", walletAddress.toLowerCase());

      if (error) {
        console.error("Supabase getInventory error:", error);
        return undefined;
      }
      
      const potions = { health: 0, ki: 0, immunity: 0, score: 0 };
      data?.forEach((item: any) => {
        if (item.item in potions) {
          potions[item.item as keyof typeof potions]++;
        }
      });

      return { walletAddress, potions } as any;
    } catch (err) {
      console.error("Error in getInventory:", err);
      return undefined;
    }
  }

  async upsertInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const walletLower = insertInventory.walletAddress.toLowerCase();
    try {
      // No novo esquema, inventory é uma lista de itens. 
      // Por enquanto, apenas retorna o estado atual para evitar erros.
      return this.getInventory(walletLower) as any;
    } catch (err) {
      console.error("Error in upsertInventory:", err);
      throw err;
    }
  }

  async getUpgrades(walletAddress: string): Promise<Upgrade | undefined> {
    try {
      const { data, error } = await supabase
        .from("upgrades")
        .select("*")
        .eq("wallet", walletAddress.toLowerCase());

      if (error) {
        console.error("Supabase getUpgrades error:", error);
        return undefined;
      }
      
      const stats = { health: 0, damage: 0, speed: 0, ki: 0 };
      data?.forEach((upg: any) => {
        if (upg.upgrade in stats) {
          stats[upg.upgrade as keyof typeof stats] = upg.level;
        }
      });

      return { walletAddress, stats } as any;
    } catch (err) {
      console.error("Error in getUpgrades:", err);
      return undefined;
    }
  }

  async upsertUpgrades(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const walletLower = insertUpgrade.walletAddress.toLowerCase();
    try {
      return this.getUpgrades(walletLower) as any;
    } catch (err) {
      console.error("Error in upsertUpgrades:", err);
      throw err;
    }
  }
}

export const storage = new DatabaseStorage();
