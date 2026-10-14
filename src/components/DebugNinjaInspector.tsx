import React, { useState } from 'react';
import { Character, Projectile, StormZone, AIAgentConfig } from '../types';

interface DebugNinjaInspectorProps {
  characters: Character[];
  projectiles: Projectile[];
  storm: StormZone;
  fps: number;
  activeAgent: AIAgentConfig;
  onSimulateAction?: (action: 'heal' | 'reload' | 'shield' | 'storm_speed') => void;
  showHitboxes: boolean;
  onToggleHitboxes: (val: boolean) => void;
}

export const DebugNinjaInspector: React.FC<DebugNinjaInspectorProps> = ({
  characters,
  projectiles,
  storm,
  fps,
  activeAgent,
  onSimulateAction,
  showHitboxes,
  onToggleHitboxes,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  const livingChars = characters.filter((c) => c.alive);
  const livingBots = livingChars.filter((c) => c.isBot);
  const player = characters.find((c) => c.isPlayer);

  if (isMinimized) {
    return (
      <div className="fixed top-16 left-4 z-40 pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-slate-950/90 border border-emerald-500/70 hover:border-emerald-400 text-emerald-400 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-mono font-bold transition-all backdrop-blur-md active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>🥷 DebugNinja ({fps} FPS)</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">▼</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-4 z-40 w-96 bg-slate-950/95 border-2 border-emerald-500/60 rounded-2xl shadow-2xl p-4 text-xs font-mono text-slate-200 pointer-events-auto backdrop-blur-lg flex flex-col gap-3 max-h-[85vh] overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🥷</span>
          <div>
            <h4 className="font-bold text-emerald-400 leading-tight">Inspecteur DebugNinja</h4>
            <span className="text-[10px] text-slate-400">Agent : {activeAgent.name} ({activeAgent.tactics?.specialty})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fps >= 50 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
            {fps} FPS
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto space-y-3 pr-1">
        
        {/* Entités & Métriques */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-500 block">Survivants</span>
            <span className="text-amber-400 font-bold">{livingChars.length} / {characters.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Projectiles</span>
            <span className="text-blue-400 font-bold">{projectiles.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Tempête</span>
            <span className="text-purple-400 font-bold">P{storm.phase} ({Math.round(storm.radius)}m)</span>
          </div>
        </div>

        {/* Joueur principal */}
        {player && (
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider text-emerald-400">
              Statut Joueur ({player.name}) :
            </span>
            <div className="flex justify-between">
              <span>HP: <strong className="text-emerald-400">{player.health}</strong> | Shield: <strong className="text-blue-400">{player.shield}</strong></span>
              <span>Pos: ({Math.round(player.x)}, {Math.round(player.y)})</span>
            </div>
          </div>
        )}

        {/* IA Bot Monitor (Top 4 bots les plus proches) */}
        <div className="space-y-1">
          <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
            Machine d'États des Bots ({livingBots.length} IA en arène) :
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {livingBots.slice(0, 5).map((bot) => {
              const dist = player ? Math.round(Math.hypot(bot.x - player.x, bot.y - player.y)) : 0;
              return (
                <div key={bot.id} className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-[10px]">
                  <div className="truncate max-w-[140px]">
                    <span className="font-bold text-slate-200">{bot.name}</span>
                    <span className="text-slate-500 ml-1">({bot.aiAgent?.name || 'IA Standard'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                      bot.aiState === 'combat' ? 'bg-red-950 text-red-400' :
                        bot.aiState === 'run_zone' ? 'bg-amber-950 text-amber-400' :
                          bot.aiState === 'heal' ? 'bg-emerald-950 text-emerald-400' :
                            'bg-slate-800 text-slate-400'
                    }`}>
                      {bot.aiState}
                    </span>
                    <span className="text-slate-400">{dist}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions & Tests Rapides */}
        <div className="border-t border-slate-800 pt-2 space-y-2">
          <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
            Tests Unitaires & Diagnostics En Direct :
          </span>

          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-300">Afficher boîtes de collision (Hitbox)</span>
            <button
              onClick={() => onToggleHitboxes(!showHitboxes)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                showHitboxes ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showHitboxes ? 'OUI' : 'NON'}
            </button>
          </div>

          {onSimulateAction && (
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onSimulateAction('heal')}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 p-1.5 rounded-lg border border-slate-800 text-[10px] font-bold"
              >
                +25 PV Test
              </button>
              <button
                onClick={() => onSimulateAction('shield')}
                className="bg-slate-900 hover:bg-slate-800 text-blue-400 p-1.5 rounded-lg border border-slate-800 text-[10px] font-bold"
              >
                +25 PB Test
              </button>
              <button
                onClick={() => onSimulateAction('reload')}
                className="bg-slate-900 hover:bg-slate-800 text-amber-400 p-1.5 rounded-lg border border-slate-800 text-[10px] font-bold"
              >
                Recharger
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
