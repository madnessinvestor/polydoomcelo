import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Sword, Shield, Activity, Droplets, Loader2 } from "lucide-react";
import { ethers } from "ethers";

interface UpgradeTier {
  level: number;
  bonus: string;
  price: number;
}

interface UpgradeCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  tiers: UpgradeTier[];
}

const UPGRADE_DATA: UpgradeCategory[] = [
  {
    id: "arc_hp",
    name: "ArcHP",
    description: "Increases maximum health",
    icon: Heart,
    tiers: [
      { level: 1, bonus: "5", price: 5 },
      { level: 2, bonus: "10", price: 10 },
      { level: 3, bonus: "20", price: 20 },
      { level: 4, bonus: "30", price: 30 },
      { level: 5, bonus: "40", price: 40 },
      { level: 6, bonus: "55", price: 50 },
      { level: 7, bonus: "70", price: 60 },
      { level: 8, bonus: "85", price: 70 },
      { level: 9, bonus: "100", price: 80 },
      { level: 10, bonus: "200", price: 100 },
    ]
  },
  {
    id: "arc_ki",
    name: "ArcKI",
    description: "Increases maximum Ki capacity",
    icon: Zap,
    tiers: [
      { level: 1, bonus: "5", price: 5 },
      { level: 2, bonus: "10", price: 10 },
      { level: 3, bonus: "20", price: 20 },
      { level: 4, bonus: "30", price: 30 },
      { level: 5, bonus: "40", price: 40 },
      { level: 6, bonus: "55", price: 50 },
      { level: 7, bonus: "70", price: 60 },
      { level: 8, bonus: "85", price: 70 },
      { level: 9, bonus: "100", price: 80 },
      { level: 10, bonus: "200", price: 100 },
    ]
  },
  {
    id: "arc_damage",
    name: "ArcDamage",
    description: "Increases all damage dealt",
    icon: Sword,
    tiers: [
      { level: 1, bonus: "10", price: 10 },
      { level: 2, bonus: "20", price: 20 },
      { level: 3, bonus: "30", price: 40 },
      { level: 4, bonus: "45", price: 60 },
      { level: 5, bonus: "60", price: 80 },
      { level: 6, bonus: "75", price: 100 },
      { level: 7, bonus: "90", price: 120 },
      { level: 8, bonus: "105", price: 140 },
      { level: 9, bonus: "120", price: 160 },
      { level: 10, bonus: "300", price: 200 },
    ]
  },
  {
    id: "arc_regen",
    name: "ArcRegen",
    description: "Regenerates HP every 10 seconds",
    icon: Activity,
    tiers: [
      { level: 1, bonus: "0.1", price: 20 },
      { level: 2, bonus: "0.2", price: 50 },
      { level: 3, bonus: "0.3", price: 80 },
      { level: 4, bonus: "0.4", price: 110 },
      { level: 5, bonus: "0.5", price: 140 },
      { level: 6, bonus: "0.6", price: 170 },
      { level: 7, bonus: "0.7", price: 200 },
      { level: 8, bonus: "0.8", price: 230 },
      { level: 9, bonus: "0.9", price: 260 },
      { level: 10, bonus: "1", price: 300 },
    ]
  },
  {
    id: "arc_vamp",
    name: "ArcVamp",
    description: "Regenerates HP based on damage dealt",
    icon: Droplets,
    tiers: [
      { level: 1, bonus: "0.0001", price: 20 },
      { level: 2, bonus: "0.0002", price: 40 },
      { level: 3, bonus: "0.0003", price: 60 },
      { level: 4, bonus: "0.0004", price: 80 },
      { level: 5, bonus: "0.0005", price: 100 },
      { level: 6, bonus: "0.0006", price: 120 },
      { level: 7, bonus: "0.0007", price: 140 },
      { level: 8, bonus: "0.0008", price: 160 },
      { level: 9, bonus: "0.0009", price: 180 },
      { level: 10, bonus: "0.001", price: 200 },
    ]
  }
];

export function UpgradesModal({ onClose }: { onClose: () => void }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [purchasedLevels, setPurchasedLevels] = useState<Record<string, number>>({
    arc_hp: 0,
    arc_ki: 0,
    arc_damage: 0,
    arc_defence: 0,
    arc_regen: 0,
    arc_vamp: 0,
  });

  useEffect(() => {
    async function fetchOnChainLevels() {
      if (!(window as any).ethereum) return;
      
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        
        const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
        const upgradeAbi = [
          "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)",
          "function defencePrices(uint256) public view returns (uint256)"
        ];
        
        const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, provider);
        
        try {
          const data = await upgradeContract.upgrades(userAddress);
          
          // Source of truth: upgrades(user).defence
          const onChainDefence = Number(data.defence);
          
          setPurchasedLevels({
            arc_hp: Number(data.hp),
            arc_ki: Number(data.ki),
            arc_damage: Number(data.damage),
            arc_defence: onChainDefence,
            arc_regen: Number(data.regen),
            arc_vamp: Number(data.vamp)
          });
        } catch (err) {
          console.warn("Silent: Could not fetch levels via .upgrades()", err);
        }
      } catch (error) {
        console.error("Error fetching on-chain levels:", error);
      }
    }

    fetchOnChainLevels();
  }, []);

  const handleUpgrade = async (id: string) => {
    const currentLevel = purchasedLevels[id];
    
    // Bloquear botão quando defence >= 10
    if (currentLevel >= 10) return;

    const nextTier = UPGRADE_DATA.find(u => u.id === id)?.tiers[currentLevel];
    if (!nextTier) return;

    try {
      setIsUpgrading(id);

      if (!(window as any).ethereum) {
        alert("Please install MetaMask or another wallet to buy upgrades!");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const usdcAddress = "0x3600000000000000000000000000000000000000"; 
      const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
      
      const usdcAbi = [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function symbol() public view returns (string)",
        "function decimals() public view returns (uint8)"
      ];

      const upgradeAbi = [
        "function upgradeHP() public",
        "function upgradeKI() public",
        "function upgradeDamage() public",
        "function upgradeDefense() public",
        "function upgradeRegen() public",
        "function upgradeVamp() public",
        "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)",
        "function defencePrices(uint256) public view returns (uint256)"
      ];
      
      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
      const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, signer);

      // Verificação específica para ArcDefence
      if (id === "arc_defence") {
        // Ler sempre upgrades(userAddress).defence como fonte da verdade
        // Calcular o preço usando defencePrices[defence]
        try {
          const onChainData = await upgradeContract.upgrades(userAddress);
          const currentOnChainDefence = Number(onChainData.defence);
          
          if (currentOnChainDefence >= 10) {
            throw new Error("Nível máximo de defesa atingido on-chain.");
          }

          const price = await upgradeContract.defencePrices(currentOnChainDefence);
          if (price === BigInt(0)) {
            throw new Error(`Nível de defesa ${currentOnChainDefence + 1} não disponível (defencePrices[${currentOnChainDefence}] == 0).`);
          }
          
          console.log(`Validado on-chain: Nível Atual ${currentOnChainDefence}, Preço ${price.toString()}`);
        } catch (e: any) {
          throw new Error("Erro de validação on-chain (ArcDefence): " + (e.reason || e.message));
        }
      }
      
      const amount = ethers.parseUnits(nextTier.price.toString(), 6);
      const currentAllowance = await usdcContract.allowance(userAddress, upgradeContractAddress);
      
      const amountToApprove = ethers.MaxUint256;
      if (currentAllowance < amount) {
        console.log("Approving USDC...");
        const approveTx = await usdcContract.approve(upgradeContractAddress, amountToApprove);
        await approveTx.wait();
        console.log("USDC Approved");
      }
      
      const functionMap: Record<string, string> = {
        arc_hp: "upgradeHP",
        arc_ki: "upgradeKI",
        arc_damage: "upgradeDamage",
        arc_defence: "upgradeDefense",
        arc_regen: "upgradeRegen",
        arc_vamp: "upgradeVamp"
      };

      const functionName = functionMap[id];
      if (!functionName) throw new Error("Unknown upgrade function");

      console.log(`Calling ${functionName} on upgrade contract...`);
      
      // Manual gas limit for upgradeDefense to prevent estimateGas failure
      const txOptions = id === "arc_defence" ? { gasLimit: 500000 } : {};
      const tx = await upgradeContract[functionName](txOptions);
      
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Upgrade confirmed!");

      // Fetch the updated levels from on-chain to ensure consistency
      try {
        const updatedData = await upgradeContract.upgrades(userAddress);
        const newLevels: Record<string, number> = {
          arc_hp: Number(updatedData.hp),
          arc_ki: Number(updatedData.ki),
          arc_damage: Number(updatedData.damage),
          arc_defence: Number(updatedData.defence),
          arc_regen: Number(updatedData.regen),
          arc_vamp: Number(updatedData.vamp)
        };
        setPurchasedLevels(newLevels);
        
        if (window.game) {
          (window.game as any).playerUpgrades = newLevels;
          
          window.game.scene.getScenes(true).forEach(scene => {
            if ((scene as any).applyUpgradesFromGlobal) {
              (scene as any).applyUpgradesFromGlobal();
            }
          });
        }
      } catch (err) {
        console.warn("Silent: Could not update levels via .upgrades() post-tx", err);
        // Fallback to local update if fetch fails
        const newLevels = { ...purchasedLevels, [id]: currentLevel + 1 };
        setPurchasedLevels(newLevels);
        if (window.game) {
          (window.game as any).playerUpgrades = newLevels;
          window.game.scene.getScenes(true).forEach(scene => {
            if ((scene as any).applyUpgradesFromGlobal) (scene as any).applyUpgradesFromGlobal();
          });
        }
      }
      
      alert(`Upgrade ${id} activated successfully! Stats synchronized with blockchain.`);
    } catch (error: any) {
      console.error("Upgrade failed:", error);
      alert("Transaction failed: " + (error.reason || error.message || "Unknown error"));
    } finally {
      setIsUpgrading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-slate-900 border-2 border-green-500 text-white max-h-[90vh] flex flex-col overflow-hidden rounded-none shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        <CardHeader className="border-b border-slate-800 relative">
          <div className="flex flex-col items-center justify-center py-2">
            <CardTitle className="text-3xl font-bold text-green-500 uppercase tracking-widest text-center">Upgrades</CardTitle>
            <CardDescription className="text-slate-400 mt-1">Enhance your character using USDC</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPGRADE_DATA.map((upgrade) => {
                const currentLevel = purchasedLevels[upgrade.id];
                const currentBonusValue = currentLevel > 0 ? upgrade.tiers[currentLevel - 1].bonus : "0";
                const currentBonus = currentBonusValue + "%";
                const nextTier = upgrade.tiers[currentLevel];
                const Icon = upgrade.icon;
                const isLoading = isUpgrading === upgrade.id;

                return (
                  <Card key={upgrade.id} className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors rounded-none">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-none text-green-500">
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-lg truncate">{upgrade.name}</h3>
                            <div className="flex flex-col items-end">
                              <Badge variant="secondary" className="bg-slate-700 text-green-500 rounded-none">
                                Current: Lv {currentLevel}/10
                              </Badge>
                              {currentLevel < 10 && (
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                  Next: Lv {currentLevel + 1}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div 
                                key={i}
                                className={`h-1.5 flex-1 rounded-none transition-colors ${
                                  i < currentLevel ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-700"
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-sm text-slate-400 mb-2 line-clamp-1">{upgrade.description}</p>
                          
                          <div className="flex justify-between text-sm mb-4">
                            <span className="text-slate-500">Current Bonus:</span>
                            <span className="text-green-500 font-bold">+{currentBonus}</span>
                          </div>
                          
                          {currentLevel < 10 ? (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Next Bonus:</span>
                                <span className="text-green-400 font-mono">+{nextTier.bonus}%</span>
                              </div>
                              <Button 
                                onClick={() => handleUpgrade(upgrade.id)}
                                disabled={!!isUpgrading}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border-none"
                                data-testid={`button-upgrade-${upgrade.id}`}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  `Upgrade - ${nextTier.price} USDC`
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center bg-slate-900/50 rounded-none border border-slate-700">
                              <span className="text-green-500 font-bold uppercase tracking-wider text-xs">Max Level Reached</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-6 border-t border-slate-800 flex justify-center">
          <Button 
            onClick={onClose}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
            data-testid="button-close-upgrades-footer"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
