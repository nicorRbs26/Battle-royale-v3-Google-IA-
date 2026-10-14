import React, { useState, useEffect } from 'react';
import { SquadRadioMessage } from '../types';
import { voiceComms, RadioSettings } from '../services/voiceComms';

interface RadioChatterProps {
  onOpenTacticalWheel?: () => void;
  showWheelButton?: boolean;
}

export const RadioChatter: React.FC<RadioChatterProps> = ({
  onOpenTacticalWheel,
  showWheelButton = true,
}) => {
  const [currentMessage, setCurrentMessage] = useState<SquadRadioMessage | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [settings, setSettings] = useState<RadioSettings>(voiceComms.getSettings());
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = voiceComms.subscribe((msg) => {
      setCurrentMessage(msg);
      setVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5200);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    voiceComms.toggleMute();
    setSettings(voiceComms.getSettings());
  };


  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    voiceComms.setVolume(val);
    setSettings(voiceComms.getSettings());
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-auto select-none max-w-sm">
      {/* Barre d'action rapide pour la Roue Tactique & Radio */}
      <div className="flex items-center gap-2">
        {showWheelButton && onOpenTacticalWheel && (
          <button
            onClick={onOpenTacticalWheel}
            className="flex items-center gap-2 bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm group"
            title="Ouvrir la Roue d'Ordres Tactiques (Touche T ou C)"
          >
            <span className="text-sm group-hover:rotate-12 transition-transform">🎯</span>
            <span>ORDRES IA</span>
            <span className="text-[10px] bg-cyan-900/80 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-700/60 font-sans">
              [T]
            </span>
          </button>
        )}

        {/* Contrôles du son radio */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg backdrop-blur-sm">
          <button
            onClick={handleToggleMute}
            className={`text-xs p-1 rounded transition-colors ${
              settings.muted
                ? 'text-red-400 hover:text-red-300'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
            title={settings.muted ? 'Activer la radio vocale' : 'Couper la radio (Mute)'}
          >
            {settings.muted ? '🔇' : '📻'}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[10px] text-slate-500 hover:text-slate-300 p-0.5"
            title="Paramètres audio radio"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Panneau de réglage rapide audio */}
      {showSettings && (
        <div className="bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl text-xs font-mono text-slate-300 flex flex-col gap-2 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>VOLUME RADIO VOCALE</span>
            <span>{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={handleVolumeChange}
            className="w-full accent-cyan-500 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* BOÎTE DE TRANSMISSION RADIO EN DIRECT */}
      {visible && currentMessage && (
        <div className="relative bg-slate-950/95 border-2 border-slate-800 rounded-xl p-3 shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-1.5 animate-slide-in-left transition-all overflow-hidden">
          {/* Ligne lumineuse d'activité fréquence radio */}
          <div 
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: currentMessage.avatarColor }}
          />

          {/* En-tête de transmission */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: currentMessage.avatarColor }}
              />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
                {currentMessage.agentName}
              </span>
              <span className="text-[8px] font-mono text-slate-500 border border-slate-800 px-1 rounded uppercase">
                {currentMessage.agentRole || 'CANAL TACTIQUE'}
              </span>
            </div>

            {/* Onde audio animée */}
            <div className="flex items-center gap-0.5 h-3">
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${h * 100}%`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sous-titre vocal de la réplique */}
          <p className="text-xs font-sans font-medium text-slate-200 leading-relaxed pl-1 border-l-2 border-slate-800">
            "{currentMessage.text}"
          </p>

          <div className="flex justify-between items-center text-[8px] font-mono text-slate-600 pt-1 border-t border-slate-900">
            <span>FREQ 142.80 MHz // CRYPTÉ</span>
            <span className="uppercase text-slate-500">[{currentMessage.type}]</span>
          </div>
        </div>
      )}
    </div>
  );
};
