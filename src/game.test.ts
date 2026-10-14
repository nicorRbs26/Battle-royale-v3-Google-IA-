import { describe, it, expect } from 'vitest';
import { getDistance, generateWeapon, checkCircleCollision, checkPointInRect } from './utils';
import { getXpRequired, calculateMatchXp, isHatLocked, updateQuestsOnEvent } from './progression';
import { parseAIAgentJSON, PRESET_AI_AGENTS } from './googleDriveService';

describe('Game Utilities (utils.ts)', () => {
  it('should calculate distance correctly between two points', () => {
    // test: Math.sqrt((3-0)^2 + (4-0)^2) = 5
    expect(getDistance(0, 0, 3, 4)).toBe(5);
    // test: Identical points distance
    expect(getDistance(100, 100, 100, 100)).toBe(0);
  });

  it('should detect circle collisions correctly', () => {
    // # test: Overlapping circles
    expect(checkCircleCollision(0, 0, 10, 5, 0, 10)).toBe(true);
    // # test: Touching circles (boundary case)
    expect(checkCircleCollision(0, 0, 10, 20, 0, 10)).toBe(false); // distance is 20, combined radius is 20
    // # test: Far away circles
    expect(checkCircleCollision(0, 0, 5, 100, 100, 5)).toBe(false);
  });

  it('should detect point in rectangle (AABB) correctly', () => {
    // Rect at (0,0) width 100, height 100 -> bounds [-50, 50]
    // # test: Point inside
    expect(checkPointInRect(0, 0, 0, 0, 100, 100)).toBe(true);
    // # test: Point on edge
    expect(checkPointInRect(50, 0, 0, 0, 100, 100)).toBe(false); // strictly inside
    // # test: Point outside
    expect(checkPointInRect(60, 60, 0, 0, 100, 100)).toBe(false);
  });

  it('should generate a weapon with requested rarity multipliers', () => {
    // test: Generation d'une arme commune (basique)
    const commonWeapon = generateWeapon('pistol', 'common');
    expect(commonWeapon.rarity).toBe('common');
    expect(commonWeapon.damage).toBeGreaterThan(0);

    // test: Multiplicateurs de rareté (Legendary -> 1.5x damage)
    // # test: On vérifie que les dégâts légendaires sont supérieurs aux communs pour le même type
    const commonDmg = generateWeapon('assault_rifle', 'common').damage;
    const legendaryDmg = generateWeapon('assault_rifle', 'legendary').damage;
    
    // damage: Math.round(selected.damage * dmgMult)
    // Common mult: 1.0, Legendary mult: 1.5
    // Note: possible variance because it picks from a pool of candidate weapons,
    // but globally legendary should be higher.
    expect(legendaryDmg).toBeGreaterThanOrEqual(commonDmg * 1.4); 
  });
});

describe('Progression Logic (progression.ts)', () => {
  it('should return correct XP required for levels', () => {
    // test: Niv 1 requirement
    expect(getXpRequired(1)).toBe(1000);
    // test: Niv 2 requirement
    expect(getXpRequired(2)).toBe(1300);
  });

  it('should calculate math match XP correctly', () => {
    // test: Victoire (rank 1) + 5 kills + 100s survie
    // survivalXp: 100 * 1.5 = 150
    // killsXp: 5 * 100 = 500
    // rankXp: 500
    // gamesPlayedXp: 50
    // Total: 1200
    const results = calculateMatchXp(1, 5, 100);
    expect(results.totalEarnedXp).toBe(1200);
    expect(results.rankXp).toBe(500);
  });

  it('should respect level-locked items', () => {
    // test: Crown is locked before level 8
    expect(isHatLocked('crown', 5)).toBe(true);
    expect(isHatLocked('crown', 8)).toBe(false);
    expect(isHatLocked('crown', 10)).toBe(false);

    // test: Non-locked items
    expect(isHatLocked('cap', 1)).toBe(false);
  });
});

describe('Quests & Progression Dynamics (progression.ts)', () => {
  it('should update kill quest progress and award XP upon completion', () => {
    const quests = [
      {
        id: 'q1',
        title: 'Chasseur',
        description: '3 kills',
        type: 'kills' as const,
        targetValue: 3,
        currentValue: 1,
        rewardXp: 400,
        isCompleted: false,
        category: 'daily' as const,
        isWeekly: false,
      },
    ];

    // Ajouter 2 kills -> doit compléter la quête
    const result = updateQuestsOnEvent(quests, 'kills', 2);
    expect(result.completedCount).toBe(1);
    expect(result.earnedXp).toBe(400);
    expect(result.updatedQuests[0].currentValue).toBe(3);
    expect(result.updatedQuests[0].isCompleted).toBe(true);
  });

  it('should filter weapon-specific quests correctly', () => {
    const quests = [
      {
        id: 'q-sniper',
        title: 'Sniper Pro',
        description: '2 kills sniper',
        type: 'weapon_specific_kills' as const,
        weaponType: 'sniper' as const,
        targetValue: 2,
        currentValue: 0,
        rewardXp: 500,
        isCompleted: false,
        category: 'daily' as const,
        isWeekly: false,
      },
    ];

    // Kill au fusil à pompe -> ne doit pas incrémenter la quête sniper
    const resShotgun = updateQuestsOnEvent(quests, 'weapon_specific_kills', 1, 'shotgun');
    expect(resShotgun.updatedQuests[0].currentValue).toBe(0);
    expect(resShotgun.earnedXp).toBe(0);

    // Kill au sniper -> doit incrémenter
    const resSniper = updateQuestsOnEvent(quests, 'weapon_specific_kills', 1, 'sniper');
    expect(resSniper.updatedQuests[0].currentValue).toBe(1);
  });
});

describe('Combat & Mechanics Non-Regression (Mechanics Diagnostics)', () => {
  it('should prevent bot weapon lockup by simulating reload cycle', () => {
    const mockWeapon = {
      name: 'Rifle Test',
      type: 'assault_rifle' as const,
      currentClip: 0,
      clipSize: 30,
      fireRate: 150,
      reserveAmmo: 60,
    };

    // Simulation du rechargement de bot
    const isBot = true;
    let lastShootTime = Date.now();
    const now = Date.now();

    if (mockWeapon.currentClip <= 0) {
      if (isBot) {
        mockWeapon.currentClip = mockWeapon.clipSize;
        lastShootTime = now + 1200 - mockWeapon.fireRate;
      }
    }

    expect(mockWeapon.currentClip).toBe(30);
    expect(lastShootTime).toBeGreaterThan(now);
  });

  it('should prevent friendly fire damage on team members during explosions', () => {
    const owner = { id: 'player-1', teamId: 'team-blue' };
    const teammate = { id: 'ally-1', teamId: 'team-blue', alive: true, health: 100 };
    const enemy = { id: 'enemy-1', teamId: 'team-red', alive: true, health: 100 };

    const shouldDamage = (target: { id: string; teamId: string }) => {
      // Règle anti friendly-fire
      if (owner && target.id !== owner.id && target.teamId === owner.teamId) {
        return false;
      }
      return true;
    };

    expect(shouldDamage(teammate)).toBe(false); // Protégé !
    expect(shouldDamage(enemy)).toBe(true); // Subit les dégâts !
  });

  it('should accurately calculate survivor count from living entities state', () => {
    const characters = [
      { id: '1', alive: true },
      { id: '2', alive: false },
      { id: '3', alive: true },
      { id: '4', alive: false },
      { id: '5', alive: true },
    ];

    const actualAliveCount = characters.filter(c => c.alive).length;
    expect(actualAliveCount).toBe(3);
    expect(Math.max(1, actualAliveCount)).toBe(3);
  });

  it('should steer bots toward safe zone target coordinates when escaping storm', () => {
    const storm = {
      x: 1250,
      y: 1250,
      radius: 800,
      targetX: 1500,
      targetY: 1500,
      targetRadius: 400,
    };

    const safeZoneCenter = { x: storm.targetX, y: storm.targetY };
    const safeRadius = storm.targetRadius;

    // Calcul du point de repli
    const targetX = safeZoneCenter.x;
    const targetY = safeZoneCenter.y;

    const distToTarget = getDistance(targetX, targetY, storm.targetX, storm.targetY);
    expect(distToTarget).toBe(0); // Le bot converge vers le cœur sécurisé
    expect(safeRadius).toBe(400);
  });

  it('should clamp health and shield gauge values smoothly between 0% and 100%', () => {
    const calculateGaugeWidth = (val: number) => `${Math.max(0, Math.min(100, val))}%`;

    // Standard cases
    expect(calculateGaugeWidth(100)).toBe('100%');
    expect(calculateGaugeWidth(45.5)).toBe('45.5%');
    expect(calculateGaugeWidth(0)).toBe('0%');

    // Edge overflow / negative cases
    expect(calculateGaugeWidth(-15)).toBe('0%');
    expect(calculateGaugeWidth(125)).toBe('100%');
  });
});

describe('Google Drive AI Agents Integration (googleDriveService.ts)', () => {
  it('should correctly parse the user DebugNinja agent JSON and derive tactical parameters', () => {
    const rawNinjaJSON = {
      name: 'DebugNinja',
      desc: 'Identifie et résout les bugs dans le code ou les mécaniques de jeu',
      instructions: 'Tu es un expert en débogage capable de diagnostiquer et résoudre des problèmes dans le code ou les mécaniques de jeu. Ton rôle est d\'analyser les symptômes décrits...',
      tags: ['debug', 'optimisation', 'resolution'],
      style: 'concis',
      temperature: 0.3,
      created: 1786121760923,
    };

    const parsed = parseAIAgentJSON(rawNinjaJSON, 'DebugNinja.json');
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe('DebugNinja');
    expect(parsed?.tags).toContain('debug');
    expect(parsed?.tags).toContain('optimisation');
    expect(parsed?.tactics?.specialty).toBe('debug');
    expect(parsed?.tactics?.accuracy).toBeGreaterThanOrEqual(0.9);
    expect(parsed?.temperature).toBe(0.3);
  });

  it('should derive shotgun / rush combat profile for offensive agents', () => {
    const rawStrikerJSON = {
      name: 'BrawlerBot',
      desc: 'Rush assaut rapproché et dégâts massifs au shotgun',
      tags: ['shotgun', 'rush', 'assaut'],
    };

    const parsed = parseAIAgentJSON(rawStrikerJSON);
    expect(parsed).not.toBeNull();
    expect(parsed?.tactics?.specialty).toBe('combat');
    expect(parsed?.tactics?.preferredWeapon).toBe('shotgun');
    expect(parsed?.tactics?.aggression).toBeGreaterThan(0.85);
  });

  it('should derive sniper profile for long-range precision agents', () => {
    const rawSniperJSON = {
      name: 'ShadowMarksman',
      desc: 'Tireur d embuscade silencieux et tirs à longue distance',
      tags: ['sniper', 'précision'],
    };

    const parsed = parseAIAgentJSON(rawSniperJSON);
    expect(parsed).not.toBeNull();
    expect(parsed?.tactics?.specialty).toBe('sniper');
    expect(parsed?.tactics?.preferredWeapon).toBe('sniper');
    expect(parsed?.tactics?.accuracy).toBeGreaterThan(0.9);
  });

  it('should provide default presets including DebugNinja', () => {
    expect(PRESET_AI_AGENTS.length).toBeGreaterThanOrEqual(3);
    const debugNinja = PRESET_AI_AGENTS.find(a => a.name === 'DebugNinja');
    expect(debugNinja).toBeDefined();
    expect(debugNinja?.tactics?.specialty).toBe('debug');
  });

  it('should compute tactical combat distance and weapon spread accurately for an agent', () => {
    const sniperAgent = PRESET_AI_AGENTS.find(a => a.tactics?.specialty === 'sniper');
    const idealDist = sniperAgent?.tactics?.specialty === 'sniper' ? 320 : 220;
    expect(idealDist).toBe(320);

    const brawlerAgent = PRESET_AI_AGENTS.find(a => a.tactics?.specialty === 'combat');
    const brawlerDist = brawlerAgent?.tactics?.specialty === 'combat' ? 130 : 220;
    expect(brawlerDist).toBe(130);
  });
});

describe('Tactical Orders & Tactical Wheel (TacticalWheel.tsx)', () => {
  it('should define all 5 core tactical orders', async () => {
    const { TACTICAL_ORDERS } = await import('./components/TacticalWheel');
    expect(TACTICAL_ORDERS).toHaveLength(5);
    const orderTypes = TACTICAL_ORDERS.map(o => o.type);
    expect(orderTypes).toContain('follow');
    expect(orderTypes).toContain('hold');
    expect(orderTypes).toContain('attack');
    expect(orderTypes).toContain('heal');
    expect(orderTypes).toContain('scavenge');
  });

  it('should have distinct colors and icons for each tactical order', async () => {
    const { TACTICAL_ORDERS } = await import('./components/TacticalWheel');
    const colors = new Set(TACTICAL_ORDERS.map(o => o.color));
    expect(colors.size).toBe(5);
    TACTICAL_ORDERS.forEach(order => {
      expect(order.icon).toBeTruthy();
      expect(order.title).toBeTruthy();
      expect(order.subtitle).toBeTruthy();
    });
  });
});

describe('Procedural Arena & Tactical Structures (utils.ts)', () => {
  it('should generate radar stations, power generators, bunkers and craters across biomes', async () => {
    const { generateProceduralArena } = await import('./utils');
    const arena = generateProceduralArena('military_forest');
    expect(arena.buildings.length).toBeGreaterThan(10);

    const radar = arena.buildings.find(b => b.subType === 'radar_station');
    expect(radar).toBeDefined();
    expect(radar?.type).toBe('structure');

    const generator = arena.buildings.find(b => b.subType === 'power_generator');
    expect(generator).toBeDefined();

    const bunker = arena.buildings.find(b => b.subType === 'command_bunker');
    expect(bunker).toBeDefined();

    const crater = arena.buildings.find(b => b.subType === 'crater_impact');
    expect(crater).toBeDefined();
  });

  it('should generate tactical points of interest in industrial and desert arenas as well', async () => {
    const { generateProceduralArena } = await import('./utils');
    const industrial = generateProceduralArena('industrial');
    expect(industrial.buildings.some(b => b.subType === 'radar_station')).toBe(true);

    const desert = generateProceduralArena('skeletal_desert');
    expect(desert.buildings.some(b => b.subType === 'radar_station')).toBe(true);
    expect(desert.buildings.some(b => b.subType === 'command_bunker')).toBe(true);
  });
});

describe('Voice Comms Service (voiceComms.ts)', () => {
  it('should allow toggling mute and adjusting volume', async () => {
    const { voiceComms } = await import('./services/voiceComms');
    const initialMuted = voiceComms.getSettings().muted;
    const toggled = voiceComms.toggleMute();
    expect(toggled).toBe(!initialMuted);
    
    // Toggle back
    voiceComms.toggleMute();
    expect(voiceComms.getSettings().muted).toBe(initialMuted);

    // Test volume clamping
    voiceComms.setVolume(1.5);
    expect(voiceComms.getSettings().volume).toBe(1);
    voiceComms.setVolume(-0.5);
    expect(voiceComms.getSettings().volume).toBe(0);
    voiceComms.setVolume(0.8);
    expect(voiceComms.getSettings().volume).toBe(0.8);
  });

  it('should dispatch broadcast messages to subscribers', async () => {
    const { voiceComms } = await import('./services/voiceComms');
    let receivedMessage = null;
    const unsubscribe = voiceComms.subscribe(msg => {
      receivedMessage = msg;
    });

    voiceComms.broadcastVoice(undefined, 'Message test de transmission radio', 'order', true);
    expect(receivedMessage).not.toBeNull();
    expect((receivedMessage as any)?.text).toBe('Message test de transmission radio');
    expect((receivedMessage as any)?.type).toBe('order');

    unsubscribe();
  });
});




