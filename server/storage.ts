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
      console.log("Storage: Fetching scores from Supabase...");
      const { data, error } = await supabase
        .from("scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase getScores error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return [];
      }
      console.log(`Storage: Successfully fetched ${data?.length || 0} scores`);
      return data || [];
    } catch (err) {
      console.error("Unexpected error in getScores:", err);
      return [];
    }
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const { data, error } = await supabase
      .from("scores")
      .insert(insertScore)
      .select()
      .single();

    if (error) {
      console.error("Supabase createScore error:", error);
      throw error;
    }
    return data;
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
        .insert({ ...insertInventory, walletAddress: walletLower })
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
        .insert({ ...insertUpgrade, walletAddress: walletLower })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
}

export const storage = new DatabaseStorage();
