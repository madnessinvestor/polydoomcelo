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
    <div className="min-h-screen w-full bg-black flex flex-col items-center overflow-auto relative">
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
      <div className="w-full flex flex-col items-center">
        {/* Game Container */}
        <div className="relative">
          <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden relative" style={{ width: '1920px', height: '1080px' }} />
          
          {/* Game Controls Instructions */}
          <div className="mt-8 mb-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 font-monospace">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <h3 className="text-amber-400 font-bold mb-4 text-xl">BASIC CONTROLS</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>MOVEMENT</span>
                    <span className="text-white">ARROW KEYS</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>JUMP</span>
                    <span className="text-white">UP ARROW</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>DASH / EVADE</span>
                    <span className="text-white">DOUBLE TAP (ARROWS)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>PUNCH</span>
                    <span className="text-white">Z KEY</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>MAGIC ATTACK</span>
                    <span className="text-white">C KEY</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <h3 className="text-amber-400 font-bold mb-4 text-xl">SPECIAL ABILITIES</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>CHARGE ARCKI</span>
                    <span className="text-white">X KEY (HOLD)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>ARCKAMEHAMEHA</span>
                    <span className="text-white">V KEY (HOLD AND RELEASE)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>ARCGENKIDAMA</span>
                    <span className="text-white">B KEY (HOLD AND RELEASE)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>EXPLOSION KIARC</span>
                    <span className="text-white">F KEY (PRESS)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>USE POTIONS</span>
                    <span className="text-white">Q, W, E, R KEYS</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span>PAUSE / MENU</span>
                    <span className="text-white">ESC / P</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
