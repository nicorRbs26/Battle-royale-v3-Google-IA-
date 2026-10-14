/**
 * Session Security & Verification Module (Anti-Cheat / Match Log Validation)
 * Provides cryptographic signature generation and server-side heuristic analysis
 * of top-down battle royale game logs to detect injection of falsified statistics,
 * speed-hacks, aimbots, and impossible match scores.
 */

export interface SessionEvent {
  t: number; // relative milliseconds from match start
  e: 'spawn' | 'kill' | 'heal' | 'dmg_dealt' | 'dmg_rcvd' | 'chest' | 'move';
  d: any; // payload of the event
}

export interface SessionPayload {
  sessionToken: string;
  rank: number;
  kills: number;
  survivedTime: number; // in seconds
  healsUsed: number;
  distanceTraveled: number; // in logical "meters"
  weaponOfChoice: string;
  playerName: string;
  timestamp: number; // Date.now() of match completion
  events: SessionEvent[];
  clientHash?: string;
}

/**
 * Pure TypeScript SHA256 implementation
 * Guarantees 100% platform-independent, synchronous hashing in both browser & node.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const hash: number[] = [h0, h1, h2, h3, h4, h5, h6, h7];

  const asciiWords: number[] = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    asciiWords[i >> 2] |= code << (24 - (i % 4) * 8);
  }

  const wordsLength = asciiWords[lengthProperty];
  for (i = 0; i < wordsLength; i++) {
    words[i] = asciiWords[i];
  }

  words[asciiLength >> 5] |= 0x80 << (24 - (asciiLength % 32));
  words[(((asciiLength + 64) >> 9) << 4) + 15] = asciiLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] || 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    const val = hash[i];
    const hex = (val >>> 0).toString(16);
    result += ('00000000' + hex).slice(-8);
  }

  return result;
}

/**
 * Computes a client-side HMAC-like signature for the match log
 */
export function generateClientSessionHash(payload: Omit<SessionPayload, 'clientHash'>, secret: string): string {
  // Sort keys of payload to ensure deterministic JSON representation
  const canonicalString = JSON.stringify({
    sessionToken: payload.sessionToken,
    rank: payload.rank,
    kills: payload.kills,
    survivedTime: payload.survivedTime,
    healsUsed: payload.healsUsed,
    distanceTraveled: payload.distanceTraveled,
    weaponOfChoice: payload.weaponOfChoice,
    playerName: payload.playerName,
    timestamp: payload.timestamp,
    eventsCount: payload.events.length,
  });

  return sha256(secret + '::' + canonicalString + '::' + secret);
}

/**
 * Performs heuristic analysis and cryptographic signature validation on a submitted match
 */
export function verifySessionIntegrity(
  payload: SessionPayload,
  secret: string
): { valid: boolean; reason?: string } {
  const {
    sessionToken,
    rank,
    kills,
    survivedTime,
    healsUsed,
    distanceTraveled,
    events,
    clientHash
  } = payload;

  // 1. Basic input integrity
  if (!sessionToken || typeof sessionToken !== 'string') {
    return { valid: false, reason: 'Identifiant de session manquant ou invalide.' };
  }
  if (!clientHash) {
    return { valid: false, reason: 'Signature cryptographique manquante (clientHash).' };
  }

  // 2. Cryptographic signature check
  const expectedHash = generateClientSessionHash(payload, secret);
  if (clientHash !== expectedHash) {
    return { valid: false, reason: 'Falsification de signature détectée (Cryptographic Tampering).' };
  }

  // 3. Logic & Bounds validation (Anti-Cheat heuristique)
  if (rank < 1 || rank > 40) {
    return { valid: false, reason: `Rang invalide (${rank}). Doit être compris entre 1 et 40.` };
  }
  if (kills < 0 || kills > 40) {
    return { valid: false, reason: `Nombre de kills suspect ou impossible (${kills}).` };
  }
  if (survivedTime < 0 || survivedTime > 3600) {
    return { valid: false, reason: `Temps de survie impossible ou suspect (${survivedTime}s).` };
  }
  if (healsUsed < 0 || healsUsed > 100) {
    return { valid: false, reason: `Nombre de soins anormalement élevé (${healsUsed}).` };
  }
  if (distanceTraveled < 0 || distanceTraveled > 100000) {
    return { valid: false, reason: `Distance parcourue invalide (${distanceTraveled}).` };
  }

  // 4. Events-to-Metrics consistency checks
  const spawnEvents = events.filter(e => e.e === 'spawn');
  const killEvents = events.filter(e => e.e === 'kill');
  const healEvents = events.filter(e => e.e === 'heal');
  const dmgDealtEvents = events.filter(e => e.e === 'dmg_dealt');

  // Must spawn once
  if (spawnEvents.length !== 1) {
    return { valid: false, reason: `Session de jeu invalide : ${spawnEvents.length} événements de réapparition détectés (attendu : 1).` };
  }

  // Match reported kills with event occurrences
  if (killEvents.length !== kills) {
    return { valid: false, reason: `Incohérence statistique : ${kills} éliminations déclarées mais seulement ${killEvents.length} enregistrées dans le journal.` };
  }

  // Match reported heals with event occurrences
  if (healEvents.length !== healsUsed) {
    return { valid: false, reason: `Incohérence statistique : ${healsUsed} soins déclarés mais ${healEvents.length} enregistrés dans le journal.` };
  }

  // 5. Advanced Speed-Hack (Teleportation) Detection
  if (survivedTime > 0) {
    // Calculer la vitesse moyenne logique (distance / temps de survie)
    const averageSpeed = distanceTraveled / survivedTime;
    // La vitesse max normale est d'environ 3.0 à 4.0 "mètres" (unités logiques de distance) par seconde
    if (averageSpeed > 25) {
      return { valid: false, reason: `Speed-Hack détecté ! Vitesse moyenne impossible (${averageSpeed.toFixed(2)} m/s).` };
    }
  }

  // 6. Advanced Aimbot / Instant-Kill Detection
  // Check if multiple kills happened in under 150ms (impossible for human recoil & transition)
  // Simultaneous kills (diff === 0) are exempt to allow legitimate rocket explosions or multi-shotgun blasts
  if (killEvents.length >= 2) {
    const sortedKills = [...killEvents].sort((a, b) => a.t - b.t);
    for (let i = 1; i < sortedKills.length; i++) {
      const diff = sortedKills[i].t - sortedKills[i - 1].t;
      if (diff > 0 && diff < 150) {
        return { valid: false, reason: `Aimbot ou Kill-Aura détecté ! Éliminations trop rapprochées (${diff}ms).` };
      }
    }
  }

  // Check for abnormal damage spikes (e.g. infinite damage hack)
  for (const dmgEvent of dmgDealtEvents) {
    const amount = dmgEvent.d?.amount;
    if (typeof amount !== 'number' || amount <= 0 || amount > 250) {
      return { valid: false, reason: `Dégâts anormaux détectés dans le journal de combat (${amount} dégâts en un coup).` };
    }
  }

  return { valid: true };
}
