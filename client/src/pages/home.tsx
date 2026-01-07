import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ArrowUpCircle, Beaker, Zap, Shield, Star } from "lucide-react";
import { PauseModal } from "@/components/pause-modal";
import { UpgradesModal } from "@/components/upgrades-modal";
import { ShoppingModal } from "@/components/shopping-modal";
import { ethers } from "ethers";

const POTIONS_UI = [
  { id: "health", key: "Q", icon: Beaker, color: "text-red-500", borderColor: "border-red-500/50" },
  { id: "ki", key: "W", icon: Zap, color: "text-blue-500", borderColor: "border-blue-500/50" },
  { id: "immunity", key: "E", icon: Shield, color: "text-yellow-500", borderColor: "border-yellow-500/50" },
  { id: "score", key: "R", icon: Star, color: "text-purple-500", borderColor: "border-purple-500/50" }
];

declare global {
  interface Window {
    arc?: any;
    isArcConnected?: boolean;
    game?: Phaser.Game;
    showPauseModal?: () => void;
    hidePauseModal?: () => void;
    pauseOpening?: () => void;
    openUpgradesModal?: () => void;
    showUpgradesModal?: () => void;
    openShoppingModal?: () => void;
    playerInventory?: Record<string, number>;
  }
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({
    health: 0,
    ki: 0,
    immunity: 0,
    score: 0
  });

  const fetchUpgradesAndInventory = async () => {
    if (!(window as any).ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
      const upgradeAbi = [
        "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)"
      ];
      
      let upgradesData = null;

      // Fetch Upgrades
      try {
        const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, signer);
        const data = await upgradeContract.upgrades(userAddress);
        upgradesData = {
          arc_hp: Number(data.hp),
          arc_ki: Number(data.ki),
          arc_damage: Number(data.damage),
          arc_defence: Number(data.defence),
          arc_regen: Number(data.regen),
          arc_vamp: Number(data.vamp)
        };
        console.log("React: Initial upgrades fetched:", upgradesData);
      } catch (err) {
        console.warn("Could not fetch on-chain upgrades:", err);
      }

      // Get Inventory from local storage tied to wallet
      const inventoryKey = `player_inventory_${userAddress.toLowerCase()}`;
      const saved = localStorage.getItem(inventoryKey);
      let inventoryData = saved ? JSON.parse(saved) : { health: 0, ki: 0, immunity: 0, score: 0 };
      
      if (!saved) {
        localStorage.setItem(inventoryKey, JSON.stringify(inventoryData));
      }
      
      setInventory(inventoryData);
      (window as any).walletAddress = userAddress; // Store for game scene usage

      return { upgrades: upgradesData, inventory: inventoryData };
    } catch (e) {
      console.error("Error fetching data for game start:", e);
      return null;
    }
  };

  const handleContinueGame = () => {
    setIsPauseModalOpen(false);
    // Resume game through window reference
    if (window.game?.scene.isActive('MainScene')) {
      const scene = window.game.scene.getScene('MainScene') as any;
      if (scene.isPaused) {
        scene.closePauseModal?.();
      }
    }
  };

  const handleExitGame = () => {
    setIsPauseModalOpen(false);
    // Exit game through window reference
    if (window.game?.scene.isActive('MainScene')) {
      const scene = window.game.scene.getScene('MainScene') as any;
      scene?.exitGameFromPause?.();
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUpgradesAndInventory().then(data => {
        const upgrades = data?.upgrades;
        const inventory = data?.inventory;
        
        // Ensure data is available before game initialization
        if (upgrades) (window as any).playerUpgrades = upgrades;
        if (inventory) (window as any).playerInventory = inventory;

        import("@/lib/game").then((mod) => {
          mod.initGame(upgrades || undefined);
          
          // Trigger HUD updates more aggressively
          const updateHUD = () => {
            if (window.game) {
              const scene = (window.game as any).scene.getScene('MainScene') as any;
              if (scene && scene.updateInventoryHUD) {
                scene.updateInventoryHUD();
              }
            }
          };

          // Update at multiple intervals to ensure it catches the scene ready state
          setTimeout(updateHUD, 100);
          setTimeout(updateHUD, 500);
          setTimeout(updateHUD, 1000);
          setTimeout(updateHUD, 2000);
        });
      });
    }

    // Set up window functions for pause modal
    (window as any).showPauseModal = () => {
      console.log("React: showPauseModal called");
      setIsPauseModalOpen(true);
    };
    (window as any).hidePauseModal = () => {
      console.log("React: hidePauseModal called");
      setIsPauseModalOpen(false);
    };

    const handleOpeningMusic = () => {
      if (window.game?.scene.isActive('MainScene')) {
        const scene = window.game.scene.getScene('MainScene') as any;
        scene.stopOpeningMusic?.();
      }
    };
    (window as any).pauseOpening = handleOpeningMusic;

    const triggerUpgrades = () => {
      console.log("React: triggerUpgrades called");
      setIsPauseModalOpen(false);
      setIsUpgradesOpen(true);
    };
    (window as any).openUpgradesModal = triggerUpgrades;
    (window as any).showUpgradesModal = triggerUpgrades;

    const triggerShopping = () => {
      console.log("React: triggerShopping called");
      setIsPauseModalOpen(false);
      setIsShoppingOpen(true);
    };
    (window as any).openShoppingModal = triggerShopping;

    return () => {
      delete (window as any).showPauseModal;
      delete (window as any).hidePauseModal;
      delete (window as any).openUpgradesModal;
      delete (window as any).showUpgradesModal;
      delete (window as any).openShoppingModal;
    };
  }, [isConnected]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 overflow-hidden relative">
      {isPauseModalOpen && (
        <PauseModal 
          onContinue={handleContinueGame} 
          onExit={handleExitGame}
        />
      )}
      {isUpgradesOpen && (
        <UpgradesModal onClose={() => setIsUpgradesOpen(false)} />
      )}
      {isShoppingOpen && (
        <ShoppingModal onClose={() => setIsShoppingOpen(false)} />
      )}
      <div className="w-full max-w-4xl flex flex-col h-screen">
        {/* Game Container */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
          <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden relative" />
          
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="text-slate-400 text-sm flex flex-wrap justify-center gap-x-4 gap-y-2 px-4">
              <div className="flex gap-2">
                <span className="text-white">Arrow Keys:</span>
                <span className="text-slate-400">Move / Jump</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">Double-Click Arrow:</span>
                <span className="text-slate-400">Dash</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">Z:</span>
                <span className="text-slate-400">Punch</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">X:</span>
                <span className="text-slate-400">Charge KiArc</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">C:</span>
                <span className="text-slate-400">Magic</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">V:</span>
                <span className="text-slate-400">ArcKamehameha</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">B:</span>
                <span className="text-slate-400">ArcGenkiDama</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">F:</span>
                <span className="text-slate-400">Explosion KiArc</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-60 mt-8 mb-4 pointer-events-auto">
            <div className="text-[10px] text-slate-400 font-mono">
              2026 PolyDoom Arc — Built on Arc Network. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-slate-500 font-mono">
              <a href="https://x.com/madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">X (Twitter)</a>
              <a href="https://github.com/madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
              <a href="https://www.youtube.com/@madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">YouTube</a>
              <a href="https://farcaster.xyz/madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Farcaster</a>
              <a href="https://www.instagram.com/madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Instagram</a>
              <a href="https://web.telegram.org/k/#@madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Telegram</a>
              <a href="https://discord.com/users/madnessinvestor" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Discord</a>
            </div>
          </div>
          <div className="fixed bottom-4 right-4 z-50">
            <a 
              href="https://testnet.arcscan.app/address/0x9b673bDBA9ed06989b1846d4C63468BCE86cf006" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono"
            >
              0x9b673bDBA9ed06989b1846d4C63468BCE86cf006
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
