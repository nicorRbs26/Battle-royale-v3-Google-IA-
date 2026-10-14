import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface PCShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PCShortcutsModal: React.FC<PCShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Z / Q / S / D ou Flèches', desc: 'Déplacement du personnage' },
    { key: 'Espace', desc: 'Saut / Valider' },
    { key: 'Maj (Shift)', desc: 'Dash / Course rapide' },
    { key: 'F', desc: 'Basculer le mode plein écran' },
    { key: 'M', desc: 'Ouvrir / Fermer la carte ou menu tactique' },
    { key: '1 - 9', desc: 'Sélection rapide d arsenal / compétences' },
    { key: 'Échap (Esc)', desc: 'Pause / Menu principal' },
    { key: 'C', desc: 'Ouvrir le panneau de contrôle PC' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Keyboard className="w-5 h-5" />
            <span>Raccourcis Clavier Avancés (Version PC)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-slate-800/60 rounded-xl border border-slate-700/50"
            >
              <span className="text-slate-300 text-sm">{item.desc}</span>
              <kbd className="px-3 py-1.5 bg-cyan-950 border border-cyan-500/50 rounded-lg text-cyan-300 font-mono text-xs shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-500">
          Appuyez sur n importe quelle touche pour fermer ou cliquez sur la croix.
        </div>
      </div>
    </div>
  );
};
