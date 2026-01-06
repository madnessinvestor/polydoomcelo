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
      
      const shopContractAddress = "0x6b09296bb55f08FBD268C44a89B5B9a23db2af6a";
      const shopAbi = [
        "function getPotionBalances(address user) external view returns (uint256, uint256, uint256, uint256)"
      ];

      let upgradesData = null;
      let inventoryData = null;

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

      // Fetch Inventory
      try {
        const shopContract = new ethers.Contract(shopContractAddress, shopAbi, signer);
        const [health, ki, immunity, score] = await shopContract.getPotionBalances(userAddress);
        inventoryData = {
          health: Number(health),
          ki: Number(ki),
          immunity: Number(immunity),
          score: Number(score)
        };
        console.log("React: Initial inventory fetched:", inventoryData);
        setInventory(inventoryData);
        localStorage.setItem('player_inventory', JSON.stringify(inventoryData));
      } catch (err) {
        console.warn("Could not fetch on-chain inventory:", err);
        const saved = localStorage.getItem('player_inventory');
        if (saved) setInventory(JSON.parse(saved));
      }

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
        
        import("@/lib/game").then((mod) => {
          mod.initGame(upgrades || undefined);
          
          // Ensure data is available to game immediately
          if (window.game) {
            if (upgrades) (window.game as any).playerUpgrades = upgrades;
            if (inventory) (window.game as any).playerInventory = inventory;
          }
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
      <div className="w-full max-w-2xl flex flex-col h-screen">
        {/* Game Container */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
          <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden relative" />
          
          {/* Vertical Inventory Display - Only appears when game container is visible and active */}
          {window.game?.scene.isActive('MainScene') && (window.game.scene.getScene('MainScene') as any).isInGamemode && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-none">
              {POTIONS_UI.map((potion) => {
                const Icon = potion.icon;
                const count = inventory[potion.id] || 0;
                return (
                  <div 
                    key={potion.id} 
                    className={`w-12 h-12 bg-slate-900/60 border-2 ${potion.borderColor} flex flex-col items-center justify-center relative rounded-md shadow-lg backdrop-blur-sm opacity-80`}
                  >
                    <span className="absolute top-0.5 left-1 text-[8px] font-bold text-white/70">{potion.key}</span>
                    <Icon className={`${potion.color} w-6 h-6 mb-0.5`} />
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-green-400">x{count}</span>
                  </div>
                );
              })}
            </div>
          )}
          
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
