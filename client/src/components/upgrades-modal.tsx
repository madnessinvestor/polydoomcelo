import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Sword, Shield, Activity, Droplets } from "lucide-react";

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
      { level: 1, bonus: "5%", price: 5 },
      { level: 2, bonus: "10%", price: 10 },
      { level: 3, bonus: "20%", price: 20 },
      { level: 4, bonus: "30%", price: 30 },
      { level: 5, bonus: "40%", price: 40 },
      { level: 6, bonus: "55%", price: 50 },
      { level: 7, bonus: "70%", price: 60 },
      { level: 8, bonus: "85%", price: 70 },
      { level: 9, bonus: "100%", price: 80 },
      { level: 10, bonus: "200%", price: 100 },
    ]
  },
  {
    id: "arc_ki",
    name: "ArcKI",
    description: "Increases maximum Ki capacity",
    icon: Zap,
    tiers: [
      { level: 1, bonus: "5%", price: 5 },
      { level: 2, bonus: "10%", price: 10 },
      { level: 3, bonus: "20%", price: 20 },
      { level: 4, bonus: "30%", price: 30 },
      { level: 5, bonus: "40%", price: 40 },
      { level: 6, bonus: "55%", price: 50 },
      { level: 7, bonus: "70%", price: 60 },
      { level: 8, bonus: "85%", price: 70 },
      { level: 9, bonus: "100%", price: 80 },
      { level: 10, bonus: "200%", price: 100 },
    ]
  },
  {
    id: "arc_damage",
    name: "ArcDamage",
    description: "Increases all damage dealt",
    icon: Sword,
    tiers: [
      { level: 1, bonus: "10%", price: 10 },
      { level: 2, bonus: "20%", price: 20 },
      { level: 3, bonus: "30%", price: 40 },
      { level: 4, bonus: "45%", price: 60 },
      { level: 5, bonus: "60%", price: 80 },
      { level: 6, bonus: "75%", price: 100 },
      { level: 7, bonus: "90%", price: 120 },
      { level: 8, bonus: "105%", price: 140 },
      { level: 9, bonus: "120%", price: 160 },
      { level: 10, bonus: "300%", price: 200 },
    ]
  },
  {
    id: "arc_defence",
    name: "ArcDefence",
    description: "Reduces damage taken from enemies",
    icon: Shield,
    tiers: [
      { level: 1, bonus: "3%", price: 10 },
      { level: 2, bonus: "6%", price: 20 },
      { level: 3, bonus: "9%", price: 40 },
      { level: 4, bonus: "12%", price: 60 },
      { level: 5, bonus: "15%", price: 80 },
      { level: 6, bonus: "18%", price: 100 },
      { level: 7, bonus: "21%", price: 120 },
      { level: 8, bonus: "24%", price: 140 },
      { level: 9, bonus: "27%", price: 160 },
      { level: 10, bonus: "30%", price: 200 },
    ]
  },
  {
    id: "arc_regen",
    name: "ArcRegen",
    description: "Regenerates HP every 10 seconds",
    icon: Activity,
    tiers: [
      { level: 1, bonus: "0.1%", price: 20 },
      { level: 2, bonus: "0.2%", price: 50 },
      { level: 3, bonus: "0.3%", price: 80 },
      { level: 4, bonus: "0.4%", price: 110 },
      { level: 5, bonus: "0.5%", price: 140 },
      { level: 6, bonus: "0.6%", price: 170 },
      { level: 7, bonus: "0.7%", price: 200 },
      { level: 8, bonus: "0.8%", price: 230 },
      { level: 9, bonus: "0.9%", price: 260 },
      { level: 10, bonus: "1%", price: 300 },
    ]
  },
  {
    id: "arc_vamp",
    name: "ArcVamp",
    description: "Regenerates HP based on damage dealt",
    icon: Droplets,
    tiers: [
      { level: 1, bonus: "0.0001%", price: 20 },
      { level: 2, bonus: "0.0002%", price: 40 },
      { level: 3, bonus: "0.0003%", price: 60 },
      { level: 4, bonus: "0.0004%", price: 80 },
      { level: 5, bonus: "0.0005%", price: 100 },
      { level: 6, bonus: "0.0006%", price: 120 },
      { level: 7, bonus: "0.0007%", price: 140 },
      { level: 8, bonus: "0.0008%", price: 160 },
      { level: 9, bonus: "0.0009%", price: 180 },
      { level: 10, bonus: "0.001%", price: 200 },
    ]
  }
];

export function UpgradesModal({ onClose }: { onClose: () => void }) {
  const [purchasedLevels, setPurchasedLevels] = useState<Record<string, number>>({
    arc_hp: 0,
    arc_ki: 0,
    arc_damage: 0,
    arc_defence: 0,
    arc_regen: 0,
    arc_vamp: 0,
  });

  const handleUpgrade = (id: string) => {
    const currentLevel = purchasedLevels[id];
    if (currentLevel < 10) {
      setPurchasedLevels(prev => ({ ...prev, [id]: currentLevel + 1 }));
      // In a real app, this would trigger a blockchain transaction or server update
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] flex flex-col overflow-hidden">
        <CardHeader className="border-b border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-yellow-500">Arc Upgrades</CardTitle>
              <CardDescription className="text-slate-400">Enhance your character using USDC</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPGRADE_DATA.map((upgrade) => {
                const currentLevel = purchasedLevels[upgrade.id];
                const nextTier = upgrade.tiers[currentLevel];
                const Icon = upgrade.icon;

                return (
                  <Card key={upgrade.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-lg text-yellow-500">
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-lg truncate">{upgrade.name}</h3>
                            <Badge variant="secondary" className="bg-slate-700 text-yellow-500">
                              Lv {currentLevel}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 line-clamp-1">{upgrade.description}</p>
                          
                          {currentLevel < 10 ? (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Next Bonus:</span>
                                <span className="text-green-400 font-mono">+{nextTier.bonus}</span>
                              </div>
                              <Button 
                                onClick={() => handleUpgrade(upgrade.id)}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold h-10"
                              >
                                Upgrade - {nextTier.price} USDC
                              </Button>
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center bg-slate-900/50 rounded-md border border-slate-700">
                              <span className="text-yellow-500 font-bold uppercase tracking-wider text-xs">Max Level Reached</span>
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
      </Card>
    </div>
  );
}
