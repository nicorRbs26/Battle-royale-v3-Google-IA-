import React, { useState } from 'react';
import { Maximize, Minimize, Shield, Zap, RefreshCw, Flame } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MobileTouchControlsProps {
  onAction: (action: string, active: boolean) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  onAction,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const [dpadActive, setDpadActive] = useState<string | null>(null);

  const handleTouchStart = (dir: string) => {
    setDpadActive(dir);
    triggerHaptic('light');
    onAction(dir, true);
  };

  const handleTouchEnd = (dir: string) => {
    if (dpadActive === dir) {
      setDpadActive(null);
    }
    onAction(dir, false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 select-none">
      {/* Top Bar for Mobile Quick Actions */}
      <div className="flex justify-between items-center pointer-events-auto">
        {onToggleFullscreen && (
          <button
            onClick={() => {
              triggerHaptic('click');
              onToggleFullscreen();
            }}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full border border-white/20 active:bg-cyan-500/50 transition shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        )}
        <div className="bg-black/60 backdrop-blur-md text-cyan-400 px-3 py-1.5 rounded-full text-xs font-mono border border-cyan-500/30">
          MODE MOBILE
        </div>
      </div>

      {/* Main Touch Area: Virtual D-Pad (Left) & Action Buttons (Right) */}
      <div className="flex justify-between items-end pb-6 pointer-events-auto">
        {/* D-Pad Virtual */}
        <div className="relative w-36 h-36 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-2xl">
          {/* Up */}
          <button
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
            onMouseDown={() => handleTouchStart('up')}
            onMouseUp={() => handleTouchEnd('up')}
            className={`absolute top-2 w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white active:bg-cyan-500/60 ${dpadActive === 'up' ? 'bg-cyan-500/60 scale-95' : ''}`}
          >
            ▲
          </button>
          {/* Down */}
          <button
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={() => handleTouchEnd('down')}
            onMouseDown={() => handleTouchStart('down')}
            onMouseUp={() => handleTouchEnd('down')}
            className={`absolute bottom-2 w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white active:bg-cyan-500/60 ${dpadActive === 'down' ? 'bg-cyan-500/60 scale-95' : ''}`}
          >
            ▼
          </button>
          {/* Left */}
          <button
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={() => handleTouchEnd('left')}
            className={`absolute left-2 w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white active:bg-cyan-500/60 ${dpadActive === 'left' ? 'bg-cyan-500/60 scale-95' : ''}`}
          >
            ◀
          </button>
          {/* Right */}
          <button
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={() => handleTouchEnd('right')}
            className={`absolute right-2 w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white active:bg-cyan-500/60 ${dpadActive === 'right' ? 'bg-cyan-500/60 scale-95' : ''}`}
          >
            ▶
          </button>
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40" />
        </div>

        {/* Action Buttons (Right) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onTouchStart={() => {
              triggerHaptic('dash');
              onAction('dash', true);
            }}
            onTouchEnd={() => onAction('dash', false)}
            onMouseDown={() => {
              triggerHaptic('dash');
              onAction('dash', true);
            }}
            onMouseUp={() => onAction('dash', false)}
            className="w-16 h-16 bg-cyan-600/60 backdrop-blur-md rounded-full border border-cyan-400/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Zap className="w-5 h-5 text-cyan-200" />
            <span className="text-[10px] font-bold">DASH</span>
          </button>

          <button
            onTouchStart={() => {
              triggerHaptic('reload');
              onAction('jump', true);
            }}
            onTouchEnd={() => onAction('jump', false)}
            onMouseDown={() => {
              triggerHaptic('reload');
              onAction('jump', true);
            }}
            onMouseUp={() => onAction('jump', false)}
            className="w-16 h-16 bg-emerald-600/60 backdrop-blur-md rounded-full border border-emerald-400/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition -mt-4"
          >
            <RefreshCw className="w-6 h-6 text-emerald-200" />
            <span className="text-[10px] font-bold">RECHARGE</span>
          </button>

          <button
            onTouchStart={() => {
              triggerHaptic('light');
              onAction('special', true);
            }}
            onTouchEnd={() => onAction('special', false)}
            onMouseDown={() => {
              triggerHaptic('light');
              onAction('special', true);
            }}
            onMouseUp={() => onAction('special', false)}
            className="w-16 h-16 bg-purple-600/60 backdrop-blur-md rounded-full border border-purple-400/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Flame className="w-5 h-5 text-purple-200" />
            <span className="text-[10px] font-bold">ORDRES</span>
          </button>

          <button
            onTouchStart={() => {
              triggerHaptic('light');
              onAction('interact', true);
            }}
            onTouchEnd={() => onAction('interact', false)}
            onMouseDown={() => {
              triggerHaptic('light');
              onAction('interact', true);
            }}
            onMouseUp={() => onAction('interact', false)}
            className="w-16 h-16 bg-amber-600/60 backdrop-blur-md rounded-full border border-amber-400/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Shield className="w-5 h-5 text-amber-200" />
            <span className="text-[10px] font-bold">AGIR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
