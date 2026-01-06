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
  
  app.get(api.scores.list.path, async (req, res) => {
    const scores = await storage.getScores();
    res.json(scores);
  });

  app.post(api.scores.create.path, async (req, res) => {
    try {
      const input = api.scores.create.input.parse(req.body);
      const score = await storage.createScore(input);
      res.status(201).json(score);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Leaderboard endpoint
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const scores = await storage.getScores();
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
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

  return httpServer;
}
