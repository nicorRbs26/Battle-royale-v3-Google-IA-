import React from 'react';

interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'effect';
  price: number;
  icon: string;
  description: string;
}

const ITEMS: ShopItem[] = [
  { id: 'skin_gold', name: 'Skin Or Massif', type: 'skin', price: 500, icon: '🏆', description: 'Une brillance inégalée.' },
  { id: 'skin_void', name: 'Skin Vide Cosmique', type: 'skin', price: 800, icon: '🌌', description: 'Le néant sur votre personnage.' },
  { id: 'effect_fire', name: 'Traînée de Feu', type: 'effect', price: 300, icon: '🔥', description: 'Laissez un sillage ardent.' },
  { id: 'effect_plasma', name: 'Aura Plasma', type: 'effect', price: 450, icon: '⚡', description: 'Énergie pure autour de vous.' },
];

interface GameShopProps {
  currentXP: number;
  ownedItems: string[];
  onPurchase: (item: ShopItem) => void;
}

export default function GameShop({ currentXP, ownedItems, onPurchase }: GameShopProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-lg w-full">
      <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
        <span>🛍️</span> Boutique du Survivant
      </h2>
      <div className="mb-4 p-3 bg-slate-950 rounded-lg text-sm font-mono text-amber-400">
        XP Disponible : {currentXP}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {ITEMS.map(item => {
          const isOwned = ownedItems.includes(item.id);
          const canAfford = currentXP >= item.price;
          return (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.description}</div>
                </div>
              </div>
              <button
                disabled={isOwned || !canAfford}
                onClick={() => onPurchase(item)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  isOwned
                    ? 'bg-slate-700 text-slate-400 cursor-default'
                    : canAfford
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isOwned ? 'Possédé' : `${item.price} XP`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
