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
        .from("scores")
        .select("id, player_name, score, wave, enemies_defeated, play_time, created_at")
        .order("score", { ascending: false });

      if (error) {
        console.error("Supabase getScores error:", error);
        throw error;
      }
      
      // Map database snake_case to camelCase
      return (data || []).map((s: any) => ({
        id: s.id,
        playerName: s.player_name,
        score: s.score,
        wave: s.wave,
        enemiesDefeated: s.enemies_defeated,
        playTime: s.play_time,
        createdAt: s.created_at
      }));
    } catch (err) {
      console.error("Error in getScores:", err);
      return [];
    }
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    try {
      console.log("Saving to Supabase:", insertScore);
      const { data, error } = await supabase
        .from("scores")
        .insert({
          player_name: insertScore.playerName,
          score: insertScore.score,
          wave: insertScore.wave,
          enemies_defeated: insertScore.enemiesDefeated,
          play_time: insertScore.playTime
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase createScore error:", error);
        throw error;
      }
      console.log("Supabase save success:", data);
      return data;
    } catch (err) {
      console.error("Error in createScore:", err);
      throw err;
    }
  }

  async getInventory(walletAddress: string): Promise<Inventory | undefined> {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching inventory:", error);
      return undefined;
    }
    return data || undefined;
  }

  async upsertInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const walletLower = insertInventory.walletAddress.toLowerCase();
    const { data: existing } = await supabase
      .from("inventory")
      .select("*")
      .eq("wallet_address", walletLower)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("inventory")
        .update({ potions: insertInventory.potions })
        .eq("wallet_address", walletLower)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("inventory")
        .insert({
          wallet_address: walletLower,
          potions: insertInventory.potions
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async getUpgrades(walletAddress: string): Promise<Upgrade | undefined> {
    const { data, error } = await supabase
      .from("upgrades")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching upgrades:", error);
      return undefined;
    }
    return data || undefined;
  }

  async upsertUpgrades(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const walletLower = insertUpgrade.walletAddress.toLowerCase();
    const { data: existing } = await supabase
      .from("upgrades")
      .select("*")
      .eq("wallet_address", walletLower)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("upgrades")
        .update({ stats: insertUpgrade.stats })
        .eq("wallet_address", walletLower)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("upgrades")
        .insert({
          wallet_address: walletLower,
          stats: insertUpgrade.stats
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
}

export const storage = new DatabaseStorage();
