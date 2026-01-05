import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [masterVolume, setMasterVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(100);
  const [sfxVolume, setSfxVolume] = useState(100);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedMaster = localStorage.getItem("masterVolume");
    const savedMusic = localStorage.getItem("musicVolume");
    const savedSfx = localStorage.getItem("sfxVolume");

    if (savedMaster) setMasterVolume(parseInt(savedMaster));
    if (savedMusic) setMusicVolume(parseInt(savedMusic));
    if (savedSfx) setSfxVolume(parseInt(savedSfx));
  }, []);

  const handleBackdropClick = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleVolumeChange = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const updateVolume = (type: "master" | "music" | "sfx", value: number) => {
    if (type === "master") {
      setMasterVolume(value);
      localStorage.setItem("masterVolume", value.toString());
      applyMasterVolume(value);
    } else if (type === "music") {
      setMusicVolume(value);
      localStorage.setItem("musicVolume", value.toString());
      applyMusicVolume(value);
    } else {
      setSfxVolume(value);
      localStorage.setItem("sfxVolume", value.toString());
      applySfxVolume(value);
    }
  };

  const applyMasterVolume = (volume: number) => {
    if (window.game) {
      window.game.scene.getScenes(true).forEach(scene => {
        if ((scene as any).setMasterVolume) {
          (scene as any).setMasterVolume(volume);
        }
      });
    }
  };

  const applyMusicVolume = (volume: number) => {
    if (window.game) {
      window.game.scene.getScenes(true).forEach(scene => {
        if ((scene as any).setMusicVolume) {
          (scene as any).setMusicVolume(volume);
        }
      });
    }
  };

  const applySfxVolume = (volume: number) => {
    if (window.game) {
      // Update volume in all active scenes
      window.game.scene.getScenes(true).forEach(scene => {
        if ((scene as any).setSfxVolume) {
          (scene as any).setSfxVolume(volume);
        }
      });
    }
  };

  const handleBackToMenu = () => {
    setLocation("/");
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black/70 flex items-center justify-center p-4 pointer-events-none" onPointerDown={handleBackdropClick}>
      <Card className="w-full max-w-md bg-slate-900 border-amber-400 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-amber-400">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleBackToMenu}
              className="text-amber-400 hover:text-amber-300"
              data-testid="button-back-to-menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-amber-400 text-2xl">SETTINGS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {/* Master Volume */}
          <div className="space-y-3" onPointerDown={handleVolumeChange}>
            <div className="flex justify-between items-center">
              <label className="text-white font-semibold">Master Volume</label>
              <span className="text-amber-400 font-bold text-lg">{masterVolume}%</span>
            </div>
            <Slider
              defaultValue={[masterVolume]}
              onValueChange={(value) => updateVolume("master", value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full pointer-events-auto"
              data-testid="slider-master-volume"
            />
          </div>

          {/* Music Volume */}
          <div className="space-y-3" onPointerDown={handleVolumeChange}>
            <div className="flex justify-between items-center">
              <label className="text-white font-semibold">Background Music Volume</label>
              <span className="text-amber-400 font-bold text-lg">{musicVolume}%</span>
            </div>
            <Slider
              defaultValue={[musicVolume]}
              onValueChange={(value) => updateVolume("music", value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full pointer-events-auto"
              data-testid="slider-music-volume"
            />
          </div>

          {/* SFX Volume */}
          <div className="space-y-3" onPointerDown={handleVolumeChange}>
            <div className="flex justify-between items-center">
              <label className="text-white font-semibold">Effects Volume</label>
              <span className="text-amber-400 font-bold text-lg">{sfxVolume}%</span>
            </div>
            <Slider
              defaultValue={[sfxVolume]}
              onValueChange={(value) => updateVolume("sfx", value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full pointer-events-auto"
              data-testid="slider-sfx-volume"
            />
          </div>

          {/* Back Button */}
          <Button
            onClick={handleBackToMenu}
            className="w-full mt-8 bg-amber-400 hover:bg-amber-500 text-black font-bold text-lg py-6"
            data-testid="button-settings-close"
          >
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
