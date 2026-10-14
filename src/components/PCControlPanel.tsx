import React, { useState } from 'react';
import { X, Sliders, Monitor, Cpu, Volume2, CheckCircle2 } from 'lucide-react';

interface PCControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
}

export const PCControlPanel: React.FC<PCControlPanelProps> = ({
  isOpen,
  onClose,
  onToggleFullscreen,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'debug'>('audio');
  const [volume, setVolume] = useState<number>(80);
  const [sfxVolume, setSfxVolume] = useState<number>(90);
  const [graphicsQuality, setGraphicsQuality] = useState<'ultra' | 'high' | 'medium'>('ultra');
  const [fpsLimit, setFpsLimit] = useState<string>('120');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 p-4 border-b border-blue-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-300 font-bold">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Panneau de Contrôle Avancé (Version PC Web)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${activeTab === 'audio' ? 'bg-blue-600/30 text-blue-300 border-t border-x border-blue-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Volume2 className="w-4 h-4" />
            Audio & Son
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${activeTab === 'graphics' ? 'bg-blue-600/30 text-blue-300 border-t border-x border-blue-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" />
            Affichage & GPU
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${activeTab === 'debug' ? 'bg-blue-600/30 text-blue-300 border-t border-x border-blue-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Cpu className="w-4 h-4" />
            Diagnostics PC
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Volume Général de la Musique</span>
                  <span className="font-mono text-cyan-400">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Volume des Effets Spéciaux (SFX)</span>
                  <span className="font-mono text-cyan-400">{sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-2"
                />
              </div>
            </div>
          )}

          {activeTab === 'graphics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Qualité Graphique & Rendu</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['medium', 'high', 'ultra'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setGraphicsQuality(q)}
                      className={`p-3 rounded-xl border text-center uppercase text-xs font-bold transition ${graphicsQuality === q ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300 shadow-lg' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Limite d Images par Seconde (FPS)</label>
                <select
                  value={fpsLimit}
                  onChange={(e) => setFpsLimit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="60">60 FPS (Standard)</option>
                  <option value="120">120 FPS (Fluide)</option>
                  <option value="unlimited">Illimité (Illimité)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={onToggleFullscreen}
                  className="w-full py-3 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/50 rounded-xl text-blue-200 font-semibold transition flex items-center justify-center gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  Basculer en Plein Écran Natif
                </button>
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Moteur WebGL 2.0</div>
                    <div className="text-xs text-slate-400">Accélération matérielle active</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Optimal
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Utilisation Mémoire RAM</div>
                    <div className="text-xs text-slate-400">Cache textures et scripts</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  ~142 MB
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg"
          >
            Appliquer et Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
