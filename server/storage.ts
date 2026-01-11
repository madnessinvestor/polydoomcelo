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
        .select("*")
        .order("score", { ascending: false });

      if (error) {
        console.error("Supabase getScores error:", error);
        // Fallback para a tabela antiga se a nova não existir
        const { data: oldData, error: oldError } = await supabase
          .from("scores")
          .select("*")
          .order("score", { ascending: false });
        
        if (oldError) throw oldError;
        return (oldData || []).map((s: any) => ({
          id: s.id,
          playerName: s.player_name || s.playerName,
          score: s.score,
          wave: s.wave || 1,
          enemiesDefeated: s.enemies_defeated || s.enemiesDefeated || 0,
          playTime: s.play_time || s.playTime || 0,
          createdAt: s.created_at || s.createdAt
        }));
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
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("wallet", walletAddress.toLowerCase());

      if (error) {
        console.error("Supabase getInventory error:", error);
        // Fallback para a tabela antiga
        const { data: oldData, error: oldError } = await supabase
          .from("inventory")
          .select("*")
          .eq("wallet_address", walletAddress.toLowerCase())
          .single();
        if (oldError && oldError.code !== "PGRST116") return undefined;
        return oldData || undefined;
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
      // Tentar o novo esquema primeiro
      const { error } = await supabase
        .from("inventory")
        .select("id")
        .limit(1);

      if (error) {
        // Fallback para o esquema antigo
        const { data: existing } = await supabase
          .from("inventory")
          .select("*")
          .eq("wallet_address", walletLower)
          .single();

        if (existing) {
          const { data, error: updateError } = await supabase
            .from("inventory")
            .update({ potions: insertInventory.potions })
            .eq("wallet_address", walletLower)
            .select()
            .single();
          if (updateError) throw updateError;
          return data;
        } else {
          const { data, error: insertError } = await supabase
            .from("inventory")
            .insert({
              wallet_address: walletLower,
              potions: insertInventory.potions
            })
            .select()
            .single();
          if (insertError) throw insertError;
          return data;
        }
      }
      
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
        // Fallback para a tabela antiga
        const { data: oldData, error: oldError } = await supabase
          .from("upgrades")
          .select("*")
          .eq("wallet_address", walletAddress.toLowerCase())
          .single();
        if (oldError && oldError.code !== "PGRST116") return undefined;
        return oldData || undefined;
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
      // Tentar o novo esquema primeiro
      const { error } = await supabase
        .from("upgrades")
        .select("id")
        .limit(1);

      if (error) {
        // Fallback para o esquema antigo
        const { data: existing } = await supabase
          .from("upgrades")
          .select("*")
          .eq("wallet_address", walletLower)
          .single();

        if (existing) {
          const { data, error: updateError } = await supabase
            .from("upgrades")
            .update({ stats: insertUpgrade.stats })
            .eq("wallet_address", walletLower)
            .select()
            .single();
          if (updateError) throw updateError;
          return data;
        } else {
          const { data, error: insertError } = await supabase
            .from("upgrades")
            .insert({
              wallet_address: walletLower,
              stats: insertUpgrade.stats
            })
            .select()
            .single();
          if (insertError) throw insertError;
          return data;
        }
      }
      
      return this.getUpgrades(walletLower) as any;
    } catch (err) {
      console.error("Error in upsertUpgrades:", err);
      throw err;
    }
  }
}

export const storage = new DatabaseStorage();
