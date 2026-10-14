import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, hasFirebase } from './firebase';
import { AIAgentConfig, WeaponType } from './types';

// Google Drive Read-Only Scope
export const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

const driveProvider = new GoogleAuthProvider();
driveProvider.addScope(DRIVE_READONLY_SCOPE);
// Prompt for account selection if needed
driveProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token strictly in-memory per skill requirements.
// Do NOT store in localStorage or sessionStorage.
let inMemoryAccessToken: string | null = null;
let isSigningIn = false;

// Default Presets including the exact user-specified DebugNinja agent
export const PRESET_AI_AGENTS: AIAgentConfig[] = [
  {
    id: 'preset-debugninja',
    name: 'DebugNinja',
    desc: 'Identifie et résout les bugs dans le code ou les mécaniques de jeu',
    instructions: 'Tu es un expert en débogage capable de diagnostiquer et résoudre des problèmes dans le code ou les mécaniques de jeu. Ton rôle est d\'analyser les symptômes décrits (crashs, comportements inattendus, performances médiocres) et de proposer des solutions efficaces. Pour chaque bug, commence par poser des questions ciblées pour reproduire le problème. Utilise une approche systématique : analyse du code, vérification des hypothèses, et validation des solutions.',
    tags: ['debug', 'optimisation', 'resolution'],
    style: 'concis',
    temperature: 0.3,
    primer: 'Diagnostic systématique et correctifs de cause racine.',
    created: 1786121760923,
    source: 'preset',
    tactics: {
      aggression: 0.65,
      accuracy: 0.9,
      reactionSpeed: 140,
      preferredWeapon: 'assault_rifle',
      specialty: 'debug',
    },
  },
  {
    id: 'preset-tactician',
    name: 'AuraTactician',
    desc: 'Maître stratège de la zone de tempête, rotation prédictive et gestion optimale du bouclier.',
    instructions: 'Anticipe chaque rétrécissement du cercle. Privilégie le positionnement avantageux en hauteur et le contrôle des passages étroits avant les affrontements directs.',
    tags: ['tactique', 'survie', 'rotation', 'zone'],
    style: 'analytique',
    temperature: 0.4,
    created: 1786121800000,
    source: 'preset',
    tactics: {
      aggression: 0.45,
      accuracy: 0.85,
      reactionSpeed: 160,
      preferredWeapon: 'assault_rifle',
      specialty: 'tactician',
    },
  },
  {
    id: 'preset-striker',
    name: 'VanguardStriker',
    desc: 'Assaut éclair rapproché, duelliste agressif maximisant les dégâts par seconde.',
    instructions: 'Fonce sur les cibles isolées avec shotgun et dashs consécutifs. Ne laisse aucun répit pour soigner ou recharger.',
    tags: ['assaut', 'shotgun', 'rush', 'agressif'],
    style: 'dynamique',
    temperature: 0.7,
    created: 1786121810000,
    source: 'preset',
    tactics: {
      aggression: 0.95,
      accuracy: 0.75,
      reactionSpeed: 110,
      preferredWeapon: 'shotgun',
      specialty: 'combat',
    },
  },
  {
    id: 'preset-sniper',
    name: 'HawkeyeSniper',
    desc: 'Tireur d embuscade longue portée et observateur d équipe silencieux.',
    instructions: 'Maintiens une distance maximale de sécurité, vise les têtes à la carabine de précision et signale les mouvements ennemis.',
    tags: ['sniper', 'précision', 'embuscade', 'distance'],
    style: 'calme',
    temperature: 0.2,
    created: 1786121820000,
    source: 'preset',
    tactics: {
      aggression: 0.35,
      accuracy: 0.98,
      reactionSpeed: 130,
      preferredWeapon: 'sniper',
      specialty: 'sniper',
    },
  },
];

// LocalStorage key for persisting imported agents cache (content of agents, not credentials)
const CACHED_AGENTS_STORAGE_KEY = 'aura_royale_imported_ai_agents';
const ACTIVE_AGENT_STORAGE_KEY = 'aura_royale_active_ai_agent_id';

export function getCachedImportedAgents(): AIAgentConfig[] {
  try {
    const raw = localStorage.getItem(CACHED_AGENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCachedImportedAgents(agents: AIAgentConfig[]) {
  try {
    localStorage.setItem(CACHED_AGENTS_STORAGE_KEY, JSON.stringify(agents));
  } catch {
    // ignore
  }
}

export function getActiveAgentId(): string {
  return localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY) || 'preset-debugninja';
}

export function setActiveAgentId(agentId: string) {
  localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, agentId);
}

// Convert arbitrary agent JSON into normalized AIAgentConfig
export function parseAIAgentJSON(raw: any, fileName?: string): AIAgentConfig | null {
  if (!raw || typeof raw !== 'object') return null;

  const name = String(raw.name || fileName?.replace(/\.json$/i, '') || 'Agent IA').trim();
  const desc = String(raw.desc || raw.description || 'Agent IA personnalisé').trim();
  const instructions = String(raw.instructions || raw.prompt || raw.systemPrompt || '').trim();
  const tags: string[] = Array.isArray(raw.tags) 
    ? raw.tags.map((t: any) => String(t).toLowerCase().trim()) 
    : [];

  const style = String(raw.style || 'concis');
  const temperature = typeof raw.temperature === 'number' ? raw.temperature : 0.4;
  const primer = typeof raw.primer === 'string' ? raw.primer : '';
  const created = typeof raw.created === 'number' ? raw.created : Date.now();

  // Deduce tactical combat profile from tags and instructions
  let preferredWeapon: WeaponType = 'assault_rifle';
  let specialty: AIAgentConfig['tactics']['specialty'] = 'tactician';
  let aggression = 0.6;
  let accuracy = 0.8;
  let reactionSpeed = 150;

  const fullText = (name + ' ' + desc + ' ' + instructions + ' ' + tags.join(' ')).toLowerCase();

  if (fullText.includes('debug') || fullText.includes('ninja') || fullText.includes('diagnostic')) {
    specialty = 'debug';
    accuracy = 0.92;
    aggression = 0.65;
    reactionSpeed = 130;
    preferredWeapon = 'assault_rifle';
  } else if (fullText.includes('sniper') || fullText.includes('précision') || fullText.includes('distance')) {
    specialty = 'sniper';
    accuracy = 0.96;
    aggression = 0.35;
    reactionSpeed = 140;
    preferredWeapon = 'sniper';
  } else if (fullText.includes('shotgun') || fullText.includes('rush') || fullText.includes('assaut') || fullText.includes('combat')) {
    specialty = 'combat';
    accuracy = 0.76;
    aggression = 0.92;
    reactionSpeed = 110;
    preferredWeapon = 'shotgun';
  } else if (fullText.includes('rocket') || fullText.includes('lourd') || fullText.includes('explosif')) {
    specialty = 'combat';
    accuracy = 0.82;
    aggression = 0.85;
    preferredWeapon = 'rocket';
  } else if (fullText.includes('survie') || fullText.includes('soin') || fullText.includes('medic')) {
    specialty = 'survival';
    accuracy = 0.8;
    aggression = 0.3;
    reactionSpeed = 160;
    preferredWeapon = 'pistol';
  }

  return {
    id: `drive-${raw.name ? raw.name.toLowerCase().replace(/[^a-z0-9_-]/g, '') : Math.random().toString(36).substring(2, 9)}`,
    name,
    desc,
    instructions,
    tags,
    style,
    temperature,
    primer,
    created,
    source: 'drive',
    tactics: {
      aggression,
      accuracy,
      reactionSpeed,
      preferredWeapon,
      specialty,
    },
  };
}

// In-Memory Token & Auth Helpers
export function getDriveAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function isDriveConnected(): boolean {
  return inMemoryAccessToken !== null && auth?.currentUser !== null;
}

export function initDriveAuth(
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) {
  if (!hasFirebase || !auth) return () => {};

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && inMemoryAccessToken) {
      if (onSuccess) onSuccess(user, inMemoryAccessToken);
    } else if (!isSigningIn) {
      if (onFailure) onFailure();
    }
  });
}

export async function connectGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  if (!hasFirebase || !auth) {
    throw new Error('L\'authentification Firebase n\'est pas initialisée.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Jeton d\'accès Google Drive introuvable dans la réponse.');
    }

    inMemoryAccessToken = credential.accessToken;
    return { user: result.user, accessToken: inMemoryAccessToken };
  } catch (error: any) {
    console.error('Erreur de connexion Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function disconnectGoogleDrive(): Promise<void> {
  inMemoryAccessToken = null;
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  parents?: string[];
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

// Search and retrieve AI agent JSON files from Google Drive
export async function searchAndLoadAIAgentsFromDrive(): Promise<{
  agents: AIAgentConfig[];
  folderFound: boolean;
  folderPath: string;
  totalFilesFound: number;
  logs: string[];
}> {
  const token = inMemoryAccessToken;
  if (!token) {
    throw new Error('Vous devez d\'abord vous connecter à Google Drive avec votre compte Google.');
  }

  const logs: string[] = [];
  logs.push('Début de l\'analyse Google Drive...');

  let folderId: string | null = null;
  let folderPath = 'Racine Google Drive';
  let targetFiles: DriveFileInfo[] = [];

  // 1. Recherche du dossier "agents IA json" ou "compétences IA"
  try {
    logs.push('Recherche du dossier \'compétences IA\' ou \'agents IA json\'...');
    
    // Essai recherche directe du dossier spécifique
    const folderQueries = [
      'name = \'agents IA json\' and mimeType = \'application/vnd.google-apps.folder\' and trashed = false',
      'name contains \'agents IA\' and mimeType = \'application/vnd.google-apps.folder\' and trashed = false',
      'name = \'compétences IA\' and mimeType = \'application/vnd.google-apps.folder\' and trashed = false',
      'name contains \'compétences\' and mimeType = \'application/vnd.google-apps.folder\' and trashed = false',
    ];

    for (const fq of folderQueries) {
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fq)}&fields=files(id,name,parents)&pageSize=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (folderRes.ok) {
        const data = await folderRes.json();
        if (data.files && data.files.length > 0) {
          folderId = data.files[0].id;
          folderPath = data.files[0].name;
          logs.push(`Dossier détecté : '${data.files[0].name}' (ID: ${folderId})`);
          break;
        }
      }
    }

    // 2. Si le dossier parent "compétences IA" a été trouvé, vérifier s'il contient un sous-dossier "agents IA json"
    if (folderId && folderPath.toLowerCase().includes('compétences')) {
      const subFolderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}&fields=files(id,name)&pageSize=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (subFolderRes.ok) {
        const subData = await subFolderRes.json();
        const sub = subData.files?.find((f: any) => f.name.toLowerCase().includes('agent'));
        if (sub) {
          folderId = sub.id;
          folderPath = `${folderPath} / ${sub.name}`;
          logs.push(`Sous-dossier ciblé : '${folderPath}'`);
        }
      }
    }

    // 3. Récupérer les fichiers JSON
    if (folderId) {
      logs.push(`Lecture des fichiers dans '${folderPath}'...`);
      const fileQuery = `'${folderId}' in parents and trashed = false and (mimeType = 'application/json' or name contains '.json')`;
      const filesRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileQuery)}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (filesRes.ok) {
        const data = await filesRes.json();
        targetFiles = data.files || [];
      }
    }

    // 4. Si aucun fichier trouvé dans le dossier spécifique, chercher globalement les fichiers d'agents JSON dans tout le Drive
    if (targetFiles.length === 0) {
      logs.push('Recherche élargie de fichiers .json d\'agents IA dans le Drive...');
      const globalQuery = 'trashed = false and (name contains \'agent\' or name contains \'ninja\' or name contains \'DebugNinja\' or name contains \'.json\') and mimeType != \'application/vnd.google-apps.folder\'';
      const globalRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(globalQuery)}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (globalRes.ok) {
        const data = await globalRes.json();
        // Filtrer pour privilégier les JSON
        targetFiles = (data.files || []).filter((f: any) => f.name.endsWith('.json') || f.mimeType === 'application/json');
      }
    }

    logs.push(`${targetFiles.length} fichier(s) potentiel(s) identifié(s).`);

    // 5. Télécharger et parser chaque fichier JSON
    const loadedAgents: AIAgentConfig[] = [];

    for (const file of targetFiles) {
      try {
        logs.push(`Téléchargement de '${file.name}'...`);
        const contentRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (contentRes.ok) {
          const jsonText = await contentRes.text();
          try {
            const parsed = JSON.parse(jsonText);
            const agent = parseAIAgentJSON(parsed, file.name);
            if (agent) {
              // Assurer l'ID unique avec l'ID Drive
              agent.id = `drive-${file.id}`;
              loadedAgents.push(agent);
              logs.push(`✅ Agent chargé avec succès : "${agent.name}" (${agent.tags.join(', ')})`);
            } else {
              logs.push(`⚠️ Le fichier '${file.name}' n'a pas pu être converti en profil d'agent valide.`);
            }
          } catch (jsonErr: any) {
            logs.push(`⚠️ Erreur de parsing JSON sur '${file.name}': ${jsonErr.message}`);
          }
        }
      } catch (err: any) {
        logs.push(`Erreur sur '${file.name}': ${err.message}`);
      }
    }

    // Sauvegarder dans le cache local
    if (loadedAgents.length > 0) {
      saveCachedImportedAgents(loadedAgents);
      logs.push(`🎉 ${loadedAgents.length} agent(s) synchronisé(s) et mis en cache localement.`);
    }

    return {
      agents: loadedAgents,
      folderFound: folderId !== null,
      folderPath,
      totalFilesFound: targetFiles.length,
      logs,
    };
  } catch (error: any) {
    logs.push(`Erreur générale: ${error.message}`);
    throw error;
  }
}
