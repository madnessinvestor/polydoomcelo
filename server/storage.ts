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
      const { data, error } = await supabase
        .from("leaderboard")
        .select("id, wallet, score, created_at")
        .order("score", { ascending: false });

      if (error) {
        console.error("Supabase getScores error:", error);
        throw error;
      }
      
      return (data || []).map((s: any) => ({
        id: s.id,
        playerName: s.wallet,
        score: s.score,
        wave: 1,
        enemiesDefeated: 0,
        playTime: 0,
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
        .from("leaderboard")
        .insert({
          wallet: insertScore.playerName,
          score: insertScore.score
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        playerName: data.wallet,
        wave: 1,
        enemiesDefeated: 0,
        playTime: 0
      };
    } catch (err) {
      console.error("Error in createScore:", err);
      throw err;
    }
  }

  async getInventory(walletAddress: string): Promise<Inventory | undefined> {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("wallet", walletAddress.toLowerCase());

    if (error) return undefined;
    
    // Converter lista de itens para o formato esperado pelo jogo
    const potions = { health: 0, ki: 0, immunity: 0, score: 0 };
    data?.forEach((item: any) => {
      if (item.item in potions) {
        potions[item.item as keyof typeof potions]++;
      }
    });

    return { walletAddress, potions } as any;
  }

  async upsertInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const walletLower = insertInventory.walletAddress.toLowerCase();
    // No novo esquema, inventory é uma lista de itens. 
    // Para simplificar, vamos apenas adicionar o novo item se for uma compra
    // ou retornar o estado atual.
    return this.getInventory(walletLower) as any;
  }

  async getUpgrades(walletAddress: string): Promise<Upgrade | undefined> {
    const { data, error } = await supabase
      .from("upgrades")
      .select("*")
      .eq("wallet", walletAddress.toLowerCase());

    if (error) return undefined;
    
    const stats = { health: 0, damage: 0, speed: 0, ki: 0 };
    data?.forEach((upg: any) => {
      if (upg.upgrade in stats) {
        stats[upg.upgrade as keyof typeof stats] = upg.level;
      }
    });

    return { walletAddress, stats } as any;
  }

  async upsertUpgrades(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const walletLower = insertUpgrade.walletAddress.toLowerCase();
    return this.getUpgrades(walletLower) as any;
  }
}

export const storage = new DatabaseStorage();
