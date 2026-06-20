import { useUI } from "@/hooks/use-ui";

export function GameTitle() {
  const { isLocked } = useUI();
  return (
    <div className="flex items-center justify-center w-full h-full relative">
      {/* Local blocker to ensure even if global fails, title is blocked */}
      {isLocked && (
        <div 
          className="fixed inset-0 z-[2147483647] bg-black/60 backdrop-blur-[6px] pointer-events-auto cursor-not-allowed" 
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ touchAction: 'none', userSelect: 'none' }}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .game-title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
        }
        
        .game-title-text {
          font-family: 'Press Start 2P', monospace;
          font-size: 64px;
          font-weight: bold;
          letter-spacing: 4px;
          animation: titlePulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        
        .polydoom-text {
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 4px #fbbf24;
          text-stroke: 4px #fbbf24;
        }
        
        .celo-text {
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 4px #FCFF52;
          text-stroke: 4px #FCFF52;
        }
        
        @keyframes titlePulse {
          0%, 100% {
            -webkit-text-stroke: 4px currentColor;
            text-stroke: 4px currentColor;
            filter: brightness(1);
          }
          50% {
            -webkit-text-stroke: 5px currentColor;
            text-stroke: 5px currentColor;
            filter: brightness(1.15);
          }
        }
        
        .polydoom-text {
          animation: titlePulse 2s ease-in-out infinite;
          color: #fbbf24;
        }
        
        .celo-text {
          animation: titlePulse 2s ease-in-out infinite;
          animation-delay: 0.2s;
          color: #FCFF52;
        }
        
        @media (max-width: 768px) {
          .game-title-text {
            font-size: 36px;
            letter-spacing: 2px;
          }
          
          .polydoom-text,
          .celo-text {
            -webkit-text-stroke: 2px;
            text-stroke: 2px;
          }
          
          .polydoom-text {
            animation-name: titlePulseMobile;
          }
          
          .celo-text {
            animation-name: titlePulseMobile;
          }
        }
        
        @keyframes titlePulseMobile {
          0%, 100% {
            -webkit-text-stroke: 2px currentColor;
            text-stroke: 2px currentColor;
            filter: brightness(1);
          }
          50% {
            -webkit-text-stroke: 3px currentColor;
            text-stroke: 3px currentColor;
            filter: brightness(1.15);
          }
        }
      `}</style>

      <div className="game-title-container">
        <div className="game-title-text polydoom-text">POLYDOOM</div>
        <div className="game-title-text celo-text">CELO</div>
      </div>
    </div>
  );
}
