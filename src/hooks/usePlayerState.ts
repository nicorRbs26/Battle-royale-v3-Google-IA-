import { useState } from 'react';
import { Character } from '../types';

export const usePlayerState = () => {
  const [playerName, setPlayerName] = useState<string>('Survivant_Pro');
  const [skinColor, setSkinColor] = useState<string>('#ef4444');
  const [hatStyle, setHatStyle] = useState<Character['hatStyle']>('cap');
  const [patternStyle, setPatternStyle] = useState<Character['patternStyle']>('plain');

  return {
    playerName,
    setPlayerName,
    skinColor,
    setSkinColor,
    hatStyle,
    setHatStyle,
    patternStyle,
    setPatternStyle,
  };
};
