import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings as SettingsIcon } from "lucide-react";
import { useUI } from "@/hooks/use-ui";

export default function Settings() {
  const { openModal, closeModal } = useUI();
  const [masterVolume, setMasterVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(100);
  const [sfxVolume, setSfxVolume] = useState(100);

  useEffect(() => {
    openModal("settings");
    
    const savedMaster = localStorage.getItem("masterVolume");
    const savedMusic = localStorage.getItem("musicVolume");
    const savedSfx = localStorage.getItem("sfxVolume");

    if (savedMaster) setMasterVolume(parseInt(savedMaster));
    if (savedMusic) setMusicVolume(parseInt(savedMusic));
    if (savedSfx) setSfxVolume(parseInt(savedSfx));

    return () => closeModal();
  }, []);

  const updateVolume = (type: "master" | "music" | "sfx", value: number) => {
    if (type === "master") {
      setMasterVolume(value);
      localStorage.setItem("masterVolume", value.toString());
      applyVolume("setMasterVolume", value);
    } else if (type === "music") {
      setMusicVolume(value);
      localStorage.setItem("musicVolume", value.toString());
      applyVolume("setMusicVolume", value);
    } else {
      setSfxVolume(value);
      localStorage.setItem("sfxVolume", value.toString());
      applyVolume("setSfxVolume", value);
    }
  };

  const applyVolume = (fnName: string, volume: number) => {
    if (window.game) {
      // Direct call to game methods if they exist on the game object
      if ((window.game as any)[fnName]) {
        (window.game as any)[fnName](volume);
      }
      
      // Also try to find the method on active scenes
      window.game.scene.getScenes(true).forEach(scene => {
        if ((scene as any)[fnName]) {
          (scene as any)[fnName](volume);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-xl bg-slate-900 border-[#8b5cf6] pointer-events-auto rounded-none shadow-[0_0_15px_rgba(139,92,246,0.5)] font-pixel">
        <CardHeader className="border-b border-[#8b5cf6]/30 bg-[#8b5cf6]/20 py-3">
          <div className="flex items-center justify-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#8b5cf6]" />
            <CardTitle className="text-[#8b5cf6] text-xl uppercase font-black tracking-tighter">
              Settings
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 font-pixel-content px-6">
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-1">
              <label className="text-white font-bold uppercase tracking-widest font-pixel-label" style={{ fontSize: '1rem' }}>Master Volume</label>
              <span className="text-[#8b5cf6] font-bold" style={{ fontSize: '1rem' }}>{masterVolume}%</span>
            </div>
            <div className="w-full">
              <Slider 
                value={[masterVolume]} 
                onValueChange={(v) => updateVolume("master", v[0])} 
                max={100} 
                min={0} 
                step={1} 
                className="w-full [&_[role=slider]]:bg-[#8b5cf6] [&_[role=slider]]:border-white [&_.relative]:bg-slate-700" 
              />
            </div>
          </div>

          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-1">
              <label className="text-white font-bold uppercase tracking-widest font-pixel-label" style={{ fontSize: '1rem' }}>Music Volume</label>
              <span className="text-[#8b5cf6] font-bold" style={{ fontSize: '1rem' }}>{musicVolume}%</span>
            </div>
            <div className="w-full">
              <Slider 
                value={[musicVolume]} 
                onValueChange={(v) => updateVolume("music", v[0])} 
                max={100} 
                min={0} 
                step={1} 
                className="w-full [&_[role=slider]]:bg-[#8b5cf6] [&_[role=slider]]:border-white [&_.relative]:bg-slate-700" 
              />
            </div>
          </div>

          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-1">
              <label className="text-white font-bold uppercase tracking-widest font-pixel-label" style={{ fontSize: '1rem' }}>Effects Volume</label>
              <span className="text-[#8b5cf6] font-bold" style={{ fontSize: '1rem' }}>{sfxVolume}%</span>
            </div>
            <div className="w-full">
              <Slider 
                value={[sfxVolume]} 
                onValueChange={(v) => updateVolume("sfx", v[0])} 
                max={100} 
                min={0} 
                step={1} 
                className="w-full [&_[role=slider]]:bg-[#8b5cf6] [&_[role=slider]]:border-white [&_.relative]:bg-slate-700" 
              />
            </div>
          </div>
        </CardContent>

        <div className="p-4 border-t border-slate-800 flex justify-center">
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-8 h-10 text-base uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            CLOSE
          </Button>
        </div>
      </Card>
    </div>
  );
}
