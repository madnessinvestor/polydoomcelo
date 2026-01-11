import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { supabase } from "./supabase";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ===============================
// 🔥 ROTAS SUPABASE (NOVAS)
// ===============================

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/saveScore", async (req, res) => {
  try {
    const { playerName, score, wave, enemiesDefeated, playTime, chainId } = req.body;

    // Validação da Arc Network
    // Chain ID da Arc Network (ajuste conforme necessário)
    const ARC_NETWORK_CHAIN_ID = "0x..."; // TODO: Adicionar o Chain ID correto da Arc Network
    
    if (chainId && chainId !== ARC_NETWORK_CHAIN_ID) {
      return res.status(403).json({ 
        error: "Invalid network. Please connect to Arc Network to save scores." 
      });
    }

    if (
      !playerName ||
      score == null ||
      wave == null ||
      enemiesDefeated == null
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const { error } = await supabase.from("scores").insert({
      player_name: playerName,
      score,
      wave,
      enemies_defeated: enemiesDefeated,
      play_time: playTime ?? 0,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

