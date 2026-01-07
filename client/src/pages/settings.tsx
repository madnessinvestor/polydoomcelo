import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
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
      window.game.scene.getScenes(true).forEach(scene => {
        if ((scene as any)[fnName]) {
          (scene as any)[fnName](volume);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-md bg-slate-900 border-amber-400 pointer-events-auto">
        <CardHeader className="border-b border-amber-400">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-amber-400 hover:text-amber-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-amber-400 text-2xl uppercase font-bold tracking-tighter">Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-white font-bold uppercase text-sm tracking-widest">Master Volume</label>
              <span className="text-amber-400 font-bold text-lg">{masterVolume}%</span>
            </div>
            <Slider defaultValue={[masterVolume]} onValueChange={(v) => updateVolume("master", v[0])} max={100} min={0} step={1} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-white font-bold uppercase text-sm tracking-widest">Music Volume</label>
              <span className="text-amber-400 font-bold text-lg">{musicVolume}%</span>
            </div>
            <Slider defaultValue={[musicVolume]} onValueChange={(v) => updateVolume("music", v[0])} max={100} min={0} step={1} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-white font-bold uppercase text-sm tracking-widest">Effects Volume</label>
              <span className="text-amber-400 font-bold text-lg">{sfxVolume}%</span>
            </div>
            <Slider defaultValue={[sfxVolume]} onValueChange={(v) => updateVolume("sfx", v[0])} max={100} min={0} step={1} className="w-full" />
          </div>

          <Button onClick={closeModal} className="w-full mt-8 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-lg py-6 uppercase rounded-none">
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
