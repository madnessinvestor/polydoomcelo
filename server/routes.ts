import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from "express";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve attached_assets folder statically
  app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));
  
  // Scores endpoints
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const scores = await storage.getScores();
      res.json(scores);
    } catch (err) {
      console.error("GET /api/leaderboard error:", err);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  app.post('/api/saveScore', async (req, res) => {
    try {
      const { playerName, score, wave, enemiesDefeated, playTime } = req.body;
      
      if (!playerName || score === undefined || enemiesDefeated === undefined) {
        return res.status(400).json({ error: "Missing fields", received: req.body });
      }

      const scoreData = {
        playerName,
        score: Number(score),
        wave: Number(wave || 1),
        enemiesDefeated: Number(enemiesDefeated),
        playTime: Number(playTime || 0)
      };

      const savedScore = await storage.createScore(scoreData);
      res.status(201).json(savedScore);
    } catch (err) {
      console.error("POST /api/saveScore error:", err);
      res.status(500).json({ message: 'Failed to save score' });
    }
  });

  // Inventory endpoints
  app.get('/api/inventory/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const inv = await storage.getInventory(walletAddress);
      if (!inv) {
        return res.json({
          walletAddress,
          potions: { health: 0, ki: 0, immunity: 0, score: 0 }
        });
      }
      res.json(inv);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch inventory' });
    }
  });

  app.post('/api/inventory', async (req, res) => {
    try {
      const { walletAddress, potions } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: 'walletAddress is required' });
      }
      const inv = await storage.upsertInventory({ walletAddress, potions });
      res.json(inv);
    } catch (err) {
      res.status(500).json({ message: 'Failed to save inventory' });
    }
  });

  // Upgrades endpoints
  app.get('/api/upgrades/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const upg = await storage.getUpgrades(walletAddress);
      if (!upg) {
        return res.json({
          walletAddress,
          stats: { health: 0, damage: 0, speed: 0, ki: 0 }
        });
      }
      res.json(upg);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch upgrades' });
    }
  });

  app.post('/api/upgrades', async (req, res) => {
    try {
      const { walletAddress, stats } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: 'walletAddress is required' });
      }
      const upg = await storage.upsertUpgrades({ walletAddress, stats });
      res.json(upg);
    } catch (err) {
      res.status(500).json({ message: 'Failed to save upgrades' });
    }
  });

  // Character State (Combined)
  app.get('/api/character-state/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const [inv, upg, score] = await Promise.all([
        storage.getInventory(walletAddress),
        storage.getUpgrades(walletAddress),
        storage.getScores().then(scores => scores.find(s => s.playerName.includes(walletAddress.substring(0, 6)))) // Tentar achar por wallet
      ]);
      
      res.json({
        inventory: inv || { walletAddress, potions: { health: 0, ki: 0, immunity: 0, score: 0 } },
        upgrades: upg || { walletAddress, stats: { health: 0, damage: 0, speed: 0, ki: 0 } },
        playerName: score?.playerName || null
      });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch character state' });
    }
  });

  return httpServer;
}
