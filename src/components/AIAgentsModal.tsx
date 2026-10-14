import React, { useState, useEffect } from 'react';
import { AIAgentConfig } from '../types';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  searchAndLoadAIAgentsFromDrive, 
  getCachedImportedAgents, 
  saveCachedImportedAgents, 
  setActiveAgentId, 
  PRESET_AI_AGENTS, 
  isDriveConnected,
  parseAIAgentJSON
} from '../googleDriveService';
import { auth } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface AIAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgent: AIAgentConfig;
  onSelectAgent: (agent: AIAgentConfig) => void;
  onApplyAgentsToMatch: (agents: AIAgentConfig[]) => void;
  debugNinjaEnabled: boolean;
  onToggleDebugNinja: (enabled: boolean) => void;
}

export const AIAgentsModal: React.FC<AIAgentsModalProps> = ({
  isOpen,
  onClose,
  activeAgent,
  onSelectAgent,
  onApplyAgentsToMatch,
  debugNinjaEnabled,
  onToggleDebugNinja,
}) => {
  const [importedAgents, setImportedAgents] = useState<AIAgentConfig[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'drive' | 'debug'>('agents');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cached = getCachedImportedAgents();
      setImportedAgents(cached);
      setIsConnected(isDriveConnected());
      setCurrentUser(auth?.currentUser || null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allAgents: AIAgentConfig[] = [
    ...PRESET_AI_AGENTS,
    ...importedAgents.filter(imp => !PRESET_AI_AGENTS.some(p => p.name.toLowerCase() === imp.name.toLowerCase()))
  ];

  const handleConnect = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Connexion à Google Drive en cours...');
      const res = await connectGoogleDrive();
      setIsConnected(true);
      setCurrentUser(res.user);
      setSyncStatus('Connecté avec succès. Recherche du dossier compétences IA/agents IA json...');
      
      // Lance automatiquement la synchronisation dès la connexion
      await handleSync();
    } catch (err: any) {
      setSyncStatus(`Erreur de connexion : ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setIsConnected(false);
    setCurrentUser(null);
    setSyncStatus('Déconnecté de Google Drive.');
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Analyse du dossier \'compétences IA/agents IA json\' sur votre Drive...');
      const result = await searchAndLoadAIAgentsFromDrive();
      setSyncLogs(result.logs);
      
      if (result.agents.length > 0) {
        setImportedAgents(result.agents);
        onApplyAgentsToMatch(result.agents);
        setSyncStatus(`Succès : ${result.agents.length} agent(s) importé(s) depuis Drive.`);
      } else {
        setSyncStatus(`Aucun fichier agent JSON trouvé dans '${result.folderPath}'. Les agents prédéfinis (dont DebugNinja) restent actifs.`);
      }
    } catch (err: any) {
      setSyncStatus(`Erreur de synchronisation : ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelect = (agent: AIAgentConfig) => {
    setActiveAgentId(agent.id);
    onSelectAgent(agent);
  };

  // Upload manuel direct de fichier JSON si l'utilisateur souhaite tester immédiatement
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const agent = parseAIAgentJSON(parsed, file.name);
        if (agent) {
          const updated = [...importedAgents.filter(a => a.id !== agent.id), agent];
          setImportedAgents(updated);
          saveCachedImportedAgents(updated);
          onApplyAgentsToMatch(updated);
          handleSelect(agent);
          setSyncStatus(`Agent '${agent.name}' importé et activé !`);
        } else {
          setSyncStatus('Le fichier JSON n\'est pas un profil d\'agent IA valide.');
        }
      } catch (err: any) {
        setSyncStatus(`Erreur de lecture du fichier : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportAgent = (agent: AIAgentConfig) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(agent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${agent.name.toLowerCase()}_agent.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* En-tête */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                Centre des Agents IA <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono">Google Drive & Diagnostics</span>
              </h2>
              <p className="text-xs text-slate-400">
                Synchronisez vos agents IA depuis <span className="text-slate-300 font-mono">compétences IA/agents IA json</span> pour transformer le gameplay et les diagnostics.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'agents' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👥</span> Profils d'Agents ({allAgents.length})
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'drive' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📁</span> Google Drive & Synchronisation
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'debug' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🥷</span> Mode DebugNinja & Diagnostics
            {debugNinjaEnabled && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">ACTIF</span>}
          </button>
        </div>

        {/* Contenu principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6" style={{ touchAction: 'pan-y' }} onTouchStart={() => triggerHaptic('light')}>

          {/* STATUS NOTIFICATION BAR */}
          {syncStatus && (
            <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
              syncStatus.includes('Succès') || syncStatus.includes('activé') 
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' 
                : syncStatus.includes('Erreur') 
                  ? 'bg-red-950/50 border-red-500/50 text-red-300' 
                  : 'bg-blue-950/50 border-blue-500/50 text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {isSyncing ? <span className="animate-spin">🔄</span> : <span>ℹ️</span>}
                <span>{syncStatus}</span>
              </div>
              {syncLogs.length > 0 && (
                <button 
                  onClick={() => setShowLogs(!showLogs)} 
                  onTouchStart={() => triggerHaptic('light')}
                  className="text-[11px] underline text-slate-400 hover:text-white ml-2 p-1"
                >
                  {showLogs ? 'Masquer logs' : 'Voir logs'}
                </button>
              )}
            </div>
          )}

          {showLogs && syncLogs.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1">
              {syncLogs.map((log, idx) => (
                <div key={idx} className="leading-tight">{log}</div>
              ))}
            </div>
          )}

          {/* TAB 1: LISTE DES AGENTS */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Sélectionnez l'agent actif. Cet agent fournira des conseils tactiques en temps réel dans le GameHUD et insufflera sa personnalité aux bots de l'arène.
                </p>
                <label className="cursor-pointer text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 border border-slate-700">
                  <span>📥</span> Importer JSON local
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAgents.map((agent) => {
                  const isActive = activeAgent.id === agent.id;
                  const isExpanded = expandedAgentId === agent.id;

                  return (
                    <div 
                      key={agent.id}
                      onTouchStart={() => triggerHaptic('light')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isActive 
                          ? 'bg-slate-950/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Header carte */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                                {agent.tactics?.specialty === 'debug' ? '🥷' : agent.tactics?.specialty === 'sniper' ? '🎯' : agent.tactics?.specialty === 'combat' ? '⚔️' : '🛡️'}
                                {agent.name}
                              </h3>
                              {agent.source === 'drive' && (
                                <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                                  Drive
                                </span>
                              )}
                              {agent.source === 'preset' && (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                                  Intégré
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {agent.desc}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSelect(agent)}
                            onTouchStart={() => triggerHaptic('click')}
                            className={`text-xs px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                              isActive 
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {isActive ? '✓ Actif' : 'Choisir'}
                          </button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.tags.map((tag) => (
                            <span 
                              key={tag}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                                tag === 'debug' || tag === 'optimisation' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                  : tag === 'shotgun' || tag === 'rush' || tag === 'assaut'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    : tag === 'sniper' || tag === 'précision'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                      : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Modificateurs tactiques */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] font-mono mb-3">
                          <div>
                            <span className="text-slate-500 block">Agressivité</span>
                            <span className="text-amber-400 font-bold">{Math.round((agent.tactics?.aggression || 0.6) * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Précision</span>
                            <span className="text-emerald-400 font-bold">{Math.round((agent.tactics?.accuracy || 0.8) * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Arme favorite</span>
                            <span className="text-blue-400 font-bold uppercase">{agent.tactics?.preferredWeapon || 'rifle'}</span>
                          </div>
                        </div>

                        {/* Instructions dépliables */}
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5 animate-fade-in">
                            <div className="font-bold text-amber-400 text-[10px] uppercase font-mono">Consignes & Instructions IA :</div>
                            <p className="whitespace-pre-line leading-relaxed">{agent.instructions || 'Aucune instruction spécifique fournie.'}</p>
                            <div className="flex gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                              <span>Style : {agent.style || 'concis'}</span>
                              <span>Température : {agent.temperature ?? 0.3}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-xs">
                        <button
                          onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                          className="text-slate-400 hover:text-amber-400 text-[11px] flex items-center gap-1 font-mono"
                        >
                          {isExpanded ? '▲ Réduire' : '▼ Voir instructions'}
                        </button>
                        <button
                          onClick={() => handleExportAgent(agent)}
                          className="text-slate-400 hover:text-white text-[11px] font-mono"
                          title="Télécharger le fichier JSON de cet agent"
                        >
                          💾 Exporter JSON
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE CONNECTION */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              
              {/* Carte de connexion OAuth officielle */}
              <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Connexion Google Drive
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Cette intégration permet de lire en lecture seule (<span className="font-mono text-slate-300">drive.readonly</span>) vos fichiers d'agents IA situés dans le dossier <span className="font-mono text-amber-400 font-bold">compétences IA/agents IA json</span> sur votre Google Drive avec l'autorisation de votre compte.
                    </p>
                  </div>

                  {isConnected ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connecté
                        </span>
                        <span className="text-[10px] text-slate-400">{currentUser?.email || 'Compte Google'}</span>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-xs text-slate-300 border border-slate-700 transition-all font-bold"
                      >
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    /* Bouton Sign in with Google conforme aux standards de design */
                    <button
                      onClick={handleConnect}
                      disabled={isSyncing}
                      className="flex items-center gap-3 bg-white text-slate-800 hover:bg-slate-100 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 border border-slate-300"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Se connecter avec Google
                    </button>
                  )}
                </div>

                {/* Bouton de scan Drive */}
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Chemin cible : <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-mono">compétences IA/agents IA json/*.json</code>
                  </div>

                  <button
                    onClick={handleSync}
                    disabled={isSyncing || !isConnected}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      isConnected 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
                    {isSyncing ? 'Synchronisation en cours...' : 'Synchroniser les agents du Drive'}
                  </button>
                </div>
              </div>

              {/* Guide de format JSON pour l'utilisateur */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Structure JSON attendue dans vos fichiers d'agents :
                </h4>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">
                  {`{
  "name": "DebugNinja",
  "desc": "Identifie et résout les bugs dans le code ou les mécaniques de jeu",
  "instructions": "Tu es un expert en débogage capable de diagnostiquer...",
  "tags": ["debug", "optimisation", "resolution"],
  "style": "concis",
  "temperature": 0.3
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC & DEBUGNINJA */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/20 border-2 border-emerald-500/40 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-base text-emerald-400 flex items-center gap-2">
                      <span>🥷</span> Système d'Analyse DebugNinja
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Inspiré de l'agent <strong>DebugNinja</strong>, cet outil injecte un inspecteur de jeu en direct permettant de surveiller le tick-rate, la trajectoire des bots, les calculs de collision et l'état interne des mécaniques.
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleDebugNinja(!debugNinjaEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      debugNinjaEnabled
                        ? 'bg-emerald-500 text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {debugNinjaEnabled ? '✓ Diagnostic Actif' : 'Activer Diagnostic'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 block mb-1">1. Inspection Temps Réel</span>
                    <span className="text-[11px] text-slate-400">Surveille les FPS, le delta time, les entités vivantes et les projectiles en vol.</span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">2. État IA des Bots</span>
                    <span className="text-[11px] text-slate-400">Affiche l'état des machines d'états (combat, fuite de tempête, recharge).</span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-blue-400 block mb-1">3. Tests Unitaires & Fiabilité</span>
                    <span className="text-[11px] text-slate-400">Vérifie l'absence de régression dans les collisions et les calculs de dégâts.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center px-6">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Agent actif en match :</span>
            <span className="font-bold text-amber-400">{activeAgent.name}</span>
            <span className="text-[10px] text-slate-500">({activeAgent.tactics?.specialty})</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95"
          >
            Fermer et jouer
          </button>
        </div>

      </div>
    </div>
  );
};
