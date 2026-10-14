import React, { useState, useEffect, useRef } from 'react';
import { TacticalOrderType } from '../types';

export interface TacticalOrderOption {
  type: TacticalOrderType;
  title: string;
  subtitle: string;
  color: string;
  accentBg: string;
  icon: string;
}

export const TACTICAL_ORDERS: TacticalOrderOption[] = [
  {
    type: 'follow',
    title: 'REGROUPEMENT',
    subtitle: 'Escorte rapprochée & couverture des arrières',
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.18)',
    icon: '🛡️',
  },
  {
    type: 'hold',
    title: 'TENIR POSITION',
    subtitle: 'Ancrage défensif et contrôle du périmètre',
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.18)',
    icon: '⚓',
  },
  {
    type: 'attack',
    title: 'ASSAUT COORDONNÉ',
    subtitle: 'Feu nourri et neutralisation agressive de la cible',
    color: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.18)',
    icon: '⚔️',
  },
  {
    type: 'heal',
    title: 'REPLI & SOINS',
    subtitle: 'Décrochage sous couvert et recharge vitale',
    color: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.18)',
    icon: '🩹',
  },
  {
    type: 'scavenge',
    title: 'FOUILLE & RECON',
    subtitle: 'Balayage du secteur pour caisses et butin',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.18)',
    icon: '🧭',
  },
];

interface TacticalWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: TacticalOrderType) => void;
  teammateName?: string;
  agentSpecialty?: string;
}

export const TacticalWheel: React.FC<TacticalWheelProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  teammateName = 'Escouade IA',
  agentSpecialty,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIdxRef = useRef<number | null>(null);

  useEffect(() => {
    selectedIdxRef.current = selectedIdx;
  }, [selectedIdx]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIdx(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dead zone in center for cancellation
      if (dist < 45 || dist > 220) {
        setSelectedIdx(null);
        return;
      }

      // Angle from -PI to PI, adjusted so 0 is top
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;

      const sectorAngle = (Math.PI * 2) / TACTICAL_ORDERS.length;
      const idx = Math.floor(angle / sectorAngle) % TACTICAL_ORDERS.length;
      setSelectedIdx(idx);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 45 || dist > 220) {
        setSelectedIdx(null);
        return;
      }

      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;

      const sectorAngle = (Math.PI * 2) / TACTICAL_ORDERS.length;
      const idx = Math.floor(angle / sectorAngle) % TACTICAL_ORDERS.length;
      setSelectedIdx(idx);
    };

    const handleMouseUp = () => {
      if (selectedIdxRef.current !== null) {
        onSelectOrder(TACTICAL_ORDERS[selectedIdxRef.current].type);
      }
      onClose();
    };

    const handleTouchEnd = () => {
      if (selectedIdxRef.current !== null) {
        onSelectOrder(TACTICAL_ORDERS[selectedIdxRef.current].type);
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onSelectOrder]);

  if (!isOpen) return null;

  const currentOrder = selectedIdx !== null ? TACTICAL_ORDERS[selectedIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm select-none pointer-events-auto transition-opacity duration-150">
      
      {/* Container de la roue */}
      <div 
        ref={containerRef}
        className="relative w-96 h-96 flex items-center justify-center"
      >
        {/* Anneau holographique de fond */}
        <div className="absolute inset-0 rounded-full border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-none" />
        <div className="absolute inset-4 rounded-full border border-dashed border-slate-700/40 pointer-events-none animate-spin-slow" />

        {/* Secteurs SVG découpés avec précision */}
        <svg className="w-full h-full -rotate-90 pointer-events-none overflow-visible" viewBox="0 0 384 384">
          <defs>
            <filter id="tactical-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {TACTICAL_ORDERS.map((order, i) => {
            const count = TACTICAL_ORDERS.length;
            const angleStep = 360 / count;
            const startAngle = i * angleStep;
            const endAngle = (i + 1) * angleStep;
            const isHovered = selectedIdx === i;

            // Geometry coordinates
            const outerR = 175;
            const innerR = 65;
            const cx = 192;
            const cy = 192;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + outerR * Math.cos(startRad);
            const y1 = cy + outerR * Math.sin(startRad);
            const x2 = cx + outerR * Math.cos(endRad);
            const y2 = cy + outerR * Math.sin(endRad);

            const x3 = cx + innerR * Math.cos(endRad);
            const y3 = cy + innerR * Math.sin(endRad);
            const x4 = cx + innerR * Math.cos(startRad);
            const y4 = cy + innerR * Math.sin(startRad);

            const pathD = `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;

            return (
              <path
                key={order.type}
                d={pathD}
                fill={isHovered ? order.color : 'rgba(15, 23, 42, 0.85)'}
                fillOpacity={isHovered ? 0.35 : 0.8}
                stroke={isHovered ? order.color : 'rgba(51, 65, 85, 0.7)'}
                strokeWidth={isHovered ? 3 : 1.5}
                filter={isHovered ? 'url(#tactical-glow)' : undefined}
                className="transition-all duration-150"
              />
            );
          })}
        </svg>

        {/* Boutons d'icônes positionnés en cercle */}
        {TACTICAL_ORDERS.map((order, i) => {
          const count = TACTICAL_ORDERS.length;
          const midAngle = ((i * 360) / count + (360 / count) / 2) - 90; // Top is 0
          const rad = (midAngle * Math.PI) / 180;
          const radius = 120; // Distance from center
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isHovered = selectedIdx === i;

          return (
            <div
              key={order.type}
              style={{
                transform: `translate(${x}px, ${y}px) scale(${isHovered ? 1.18 : 1})`,
              }}
              className={`absolute flex flex-col items-center justify-center pointer-events-none transition-transform duration-150 ${
                isHovered ? 'z-20' : 'z-10'
              }`}
            >
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg border transition-all duration-150 ${
                  isHovered
                    ? 'border-white bg-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    : 'border-slate-700 bg-slate-900/90 text-slate-300'
                }`}
                style={{ borderColor: isHovered ? order.color : undefined }}
              >
                <span>{order.icon}</span>
              </div>
              <span 
                className="text-[10px] font-sans font-black tracking-wider uppercase mt-1 px-1.5 py-0.5 rounded shadow-sm"
                style={{
                  color: isHovered ? '#ffffff' : '#94a3b8',
                  backgroundColor: isHovered ? order.color : 'rgba(15, 23, 42, 0.75)',
                }}
              >
                {order.title}
              </span>
            </div>
          );
        })}

        {/* Hub Central Informatique */}
        <div className="absolute w-28 h-28 rounded-full bg-slate-950/95 border-2 border-slate-700 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_30px_rgba(0,0,0,0.9)] z-30 pointer-events-none">
          {currentOrder ? (
            <>
              <span className="text-xl leading-none mb-1">{currentOrder.icon}</span>
              <span 
                className="text-[10px] font-mono font-bold uppercase tracking-wider leading-tight"
                style={{ color: currentOrder.color }}
              >
                {currentOrder.title}
              </span>
              <span className="text-[8px] text-slate-400 font-sans mt-0.5 uppercase tracking-tighter">
                Relâcher pour valider
              </span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 animate-ping mb-1" />
              <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                ORDRES IA
              </span>
              <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                Centre : Annuler
              </span>
            </>
          )}
        </div>

      </div>

      {/* Bannière d'aide en bas */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-6 py-2 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">Cible :</span>
          <span className="text-amber-400">{teammateName}</span>
          {agentSpecialty && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
              {agentSpecialty}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <span className="text-slate-400">
          Survolez une option et <strong className="text-white">relâchez la touche</strong> pour ordonner l'escouade.
        </span>
      </div>

    </div>
  );
};
