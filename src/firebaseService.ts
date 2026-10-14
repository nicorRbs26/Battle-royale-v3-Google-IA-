import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, hasFirebase } from './firebase';
import { PlayerStats, MatchHistory } from './types';

export interface AppUser {
  uid: string;
  isAnonymous: boolean;
  isGuestFallback: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  playerName: string;
  level: number;
  wins: number;
  kills: number;
  gamesPlayed: number;
  updatedAt?: any;
}

// Subscribe to auth state updates and trigger anonymous sign in if enabled
export function initAuthSession(onUserReady: (user: AppUser) => void) {
  if (!hasFirebase) return () => {};

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      onUserReady({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        isGuestFallback: false
      });
    } else {
      signInAnonymously(auth)
        .then((cred) => {
          if (cred.user) {
            // onUserReady is already called by the onAuthStateChanged observer
            console.log('Firebase Anonymous Auth successful');
          }
        })
        .catch((err) => {
          console.warn('Firebase Anonymous Auth failed' + (err?.message ? ': ' + err.message : '') + '. Falling back to local guest session.');
          
          // Generate or retrieve a persistent client guest ID
          let guestUid = localStorage.getItem('aura_royale_guest_uid');
          if (!guestUid) {
            guestUid = 'guest_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('aura_royale_guest_uid', guestUid);
          }
          
          onUserReady({
            uid: guestUid,
            isAnonymous: false,
            isGuestFallback: true
          });
        });
    }
  });

  return unsubscribe;
}

// Sync local stats to Firestore on login or when they change
export async function syncStatsToCloud(userId: string, stats: PlayerStats, playerName: string) {
  if (!hasFirebase) return;
  if (!userId || userId.startsWith('guest_')) {
    return;
  }

  try {
    const statsRef = doc(db, 'players_stats', userId);
    
    // Save to players_stats
    await setDoc(statsRef, {
      playerName,
      gamesPlayed: stats.gamesPlayed || 0,
      wins: stats.wins || 0,
      kills: stats.kills || 0,
      top10: stats.top10 || 0,
      level: stats.level || 1,
      xp: stats.xp || 0,
      equippedWeaponEffect: stats.equippedWeaponEffect || 'none',
      equippedEmote: stats.equippedEmote || 'none',
      healsUsed: stats.healsUsed || 0,
      distanceTraveled: stats.distanceTraveled || 0,
      questsCompleted: stats.questsCompleted || [],
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Save to leaderboard score as well
    const lbRef = doc(db, 'leaderboards', userId);
    await setDoc(lbRef, {
      userId,
      playerName,
      level: stats.level || 1,
      wins: stats.wins || 0,
      kills: stats.kills || 0,
      gamesPlayed: stats.gamesPlayed || 0,
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error: any) {
    if (!navigator.onLine || error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.info('Firebase client is offline. Stats saved locally.');
    } else {
      console.warn('Could not sync stats to cloud:', error?.message || error);
    }
  }
}

// Load stats from Firestore
export async function loadStatsFromCloud(userId: string): Promise<Partial<PlayerStats> | null> {
  if (!hasFirebase || !userId || userId.startsWith('guest_')) return null;

  try {
    const statsRef = doc(db, 'players_stats', userId);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        gamesPlayed: data.gamesPlayed || 0,
        wins: data.wins || 0,
        kills: data.kills || 0,
        top10: data.top10 || 0,
        level: data.level || 1,
        xp: data.xp || 0,
        equippedWeaponEffect: data.equippedWeaponEffect || 'none',
        equippedEmote: data.equippedEmote || 'none',
        healsUsed: data.healsUsed || 0,
        distanceTraveled: data.distanceTraveled || 0,
        questsCompleted: data.questsCompleted || [],
      };
    }
  } catch (error: any) {
    if (!navigator.onLine || error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.info('Firebase client is offline. Loading stats from local cache.');
    } else {
      console.warn('Could not load stats from cloud:', error?.message || error);
    }
  }
  return null;
}


// Log a match history to Firestore
export async function logMatchHistoryToCloud(
  userId: string, 
  playerName: string, 
  record: MatchHistory
) {
  if (!hasFirebase || !navigator.onLine) return;
  if (!userId || userId.startsWith('guest_')) {
    return;
  }

  try {
    const historyCol = collection(db, 'match_history');
    await addDoc(historyCol, {
      userId,
      playerName,
      playedAt: record.playedAt,
      mode: record.mode,
      rank: record.rank,
      kills: record.kills,
      survivedTime: record.survivedTime,
      weaponOfChoice: record.weaponOfChoice,
      timestamp: serverTimestamp()
    });
  } catch (error: any) {
    if (!navigator.onLine || error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.info('Firebase client is offline. Match history recorded locally.');
    } else {
      console.warn('Could not log match history to cloud:', error?.message || error);
    }
  }
}

// Fetch the top 20 players leaderboards
export async function fetchLeaderboards(sortBy: 'wins' | 'kills' | 'level' = 'wins'): Promise<LeaderboardEntry[]> {
  if (!hasFirebase || !navigator.onLine) return [];

  try {
    const lbCol = collection(db, 'leaderboards');
    const q = query(lbCol, orderBy(sortBy, 'desc'), limit(25));
    const snap = await getDocs(q);
    
    const results: LeaderboardEntry[] = [];
    snap.forEach((d) => {
      const data = d.data();
      results.push({
        userId: d.id,
        playerName: data.playerName || 'Anonyme',
        level: data.level || 1,
        wins: data.wins || 0,
        kills: data.kills || 0,
        gamesPlayed: data.gamesPlayed || 0,
        updatedAt: data.updatedAt
      });
    });
    return results;
  } catch (error: any) {
    if (!navigator.onLine || error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.info('Firebase client is offline. Leaderboard unavailable.');
    } else {
      console.warn('Could not fetch leaderboards:', error?.message || error);
    }
    return [];
  }
}

