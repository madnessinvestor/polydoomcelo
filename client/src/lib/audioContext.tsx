import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';

interface AudioContextType {
  playOpening: () => void;
  pauseOpening: () => void;
  resumeOpening: () => void;
  setOpeningVolume: (volume: number) => void;
  isOpeningPlaying: boolean;
}

const AudioContextValue = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create audio element for opening music
    const audio = new Audio('/attached_assets/Abertura_1767113066246.mp3');
    audio.loop = true;
    audio.volume = (parseInt(localStorage.getItem('musicVolume') || '100')) / 100;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playOpening = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently handle autoplay blocking
      });
      setIsPlaying(true);
    }
  };

  const pauseOpening = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeOpening = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(() => {
        // Silently handle autoplay blocking
      });
      setIsPlaying(true);
    }
  };

  const setOpeningVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  };

  return (
    <AudioContextValue.Provider
      value={{
        playOpening,
        pauseOpening,
        resumeOpening,
        setOpeningVolume,
        isOpeningPlaying: isPlaying,
      }}
    >
      {children}
    </AudioContextValue.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextValue);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
