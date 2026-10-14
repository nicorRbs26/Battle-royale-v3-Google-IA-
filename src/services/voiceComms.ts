import { AIAgentConfig, SquadRadioMessage, TacticalOrderType } from '../types';

export interface RadioSettings {
  muted: boolean;
  volume: number; // 0 to 1
  voiceEnabled: boolean;
}

const STORAGE_KEY = 'aura_royale_radio_settings';

class VoiceCommsService {
  private audioCtx: AudioContext | null = null;
  private settings: RadioSettings = {
    muted: false,
    volume: 0.85,
    voiceEnabled: true,
  };
  private listeners: ((message: SquadRadioMessage) => void)[] = [];
  private lastSpeakTime = 0;
  private minInterval = 3200; // ms minimum between auto-alerts to prevent audio fatigue
  private availableVoices: SpeechSynthesisVoice[] = [];
  private currentMessage: SquadRadioMessage | null = null;

  constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  public saveSettings(newSettings: Partial<RadioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  public getSettings(): RadioSettings {
    return { ...this.settings };
  }

  public toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    this.saveSettings({ muted: this.settings.muted });
    if (this.settings.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.settings.muted;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.settings.volume = clamped;
    this.saveSettings({ volume: clamped });
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Radio beep / chirp simulation using Web Audio API
  public playRadioChirp(closing = false) {
    if (this.settings.muted || this.settings.volume <= 0) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (!closing) {
        // Double bip militaire tactique d'ouverture de transmission
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1240, now + 0.05);

        gain.gain.setValueAtTime(0.08 * this.settings.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        // Bruit de grésillement de fermeture de fréquence (radio squelch)
        const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.08);
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.25;
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.06 * this.settings.volume, now);
        noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.08);

        noise.connect(noiseGain);
        noiseGain.connect(this.audioCtx.destination);

        noise.start(now);
        noise.stop(now + 0.08);
      }
    } catch {
      // Audio fallback silent
    }
  }

  // Tonnerre synthétisé lourd pour l'orage électrique
  public playThunderRumble() {
    if (this.settings.muted || this.settings.volume <= 0) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 1.5);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(30, now + 1.4);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35 * this.settings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start(now);
      noise.stop(now + 1.5);
    } catch {
      // silent
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.availableVoices = window.speechSynthesis.getVoices();
      } catch {
        this.availableVoices = [];
      }
    }
  }

  public subscribe(fn: (message: SquadRadioMessage) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emitMessage(msg: SquadRadioMessage) {
    this.currentMessage = msg;
    this.listeners.forEach(fn => fn(msg));
  }

  public getCurrentMessage(): SquadRadioMessage | null {
    return this.currentMessage;
  }

  /**
   * Prononce un message radio à haute voix avec Web Speech API et diffuse le sous-titre
   */
  public broadcastVoice(
    agent: AIAgentConfig | undefined,
    text: string,
    type: SquadRadioMessage['type'],
    priority = false
  ) {
    const now = Date.now();
    if (!priority && now - this.lastSpeakTime < this.minInterval) {
      // Evite la cacophonie vocale
      return;
    }

    const agentName = agent?.name || 'Agent IA';
    const agentRole = agent?.tactics?.specialty || 'squad';
    const avatarColor =
      agentRole === 'debug'
        ? '#10b981'
        : agentRole === 'sniper'
          ? '#38bdf8'
          : agentRole === 'combat'
            ? '#f43f5e'
            : '#f59e0b';

    const radioMsg: SquadRadioMessage = {
      id: `radio-${now}-${Math.random().toString(36).substring(2, 6)}`,
      agentName,
      agentRole,
      text,
      timestamp: now,
      avatarColor,
      type,
    };

    this.lastSpeakTime = now;
    this.emitMessage(radioMsg);

    // Joue le signal radio d'ouverture
    this.playRadioChirp(false);

    if (this.settings.muted || !this.settings.voiceEnabled || typeof window === 'undefined') {
      return;
    }

    if (!('speechSynthesis' in window)) {
      return;
    }

    try {
      // Annule l'éventuelle phrase précédente si prioritaire
      if (priority) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.settings.volume;

      // Modulation selon le profil de l'agent
      if (agent?.tactics?.specialty === 'debug') {
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
      } else if (agent?.tactics?.specialty === 'sniper') {
        utterance.rate = 0.92;
        utterance.pitch = 0.88;
      } else if (agent?.tactics?.specialty === 'combat') {
        utterance.rate = 1.15;
        utterance.pitch = 1.08;
      } else {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      // Sélection de la meilleure voix française disponible
      if (this.availableVoices.length === 0) {
        this.initVoices();
      }

      const frenchVoice =
        this.availableVoices.find(v => v.lang.startsWith('fr') && v.localService) ||
        this.availableVoices.find(v => v.lang.startsWith('fr')) ||
        this.availableVoices.find(v => v.default) ||
        this.availableVoices[0];

      if (frenchVoice) {
        utterance.voice = frenchVoice;
        utterance.lang = frenchVoice.lang;
      } else {
        utterance.lang = 'fr-FR';
      }

      utterance.onend = () => {
        this.playRadioChirp(true);
      };

      utterance.onerror = () => {
        // En cas d'interruption naturelle
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback gracieux
    }
  }

  // --- CATALOGUE CONTEXTUEL DE LIGNES DE DIALOGUE TACTIQUES ---

  public sayOrderAcknowledged(agent: AIAgentConfig | undefined, orderType: TacticalOrderType) {
    const isDebug = agent?.tactics?.specialty === 'debug';
    const isSniper = agent?.tactics?.specialty === 'sniper';
    const isCombat = agent?.tactics?.specialty === 'combat';

    let lines: string[] = [];

    switch (orderType) {
    case 'follow':
      if (isDebug) {
        lines = [
          'Ordre reçu. Alignement sur les coordonnées du joueur.',
          'Protocole d\'escorte actif : je surveille votre arrière-garde.',
          'Bien reçu, liaison tactique synchronisée à vos pas.'
        ];
      } else if (isCombat) {
        lines = [
          'Compris chef ! Je colle à vos basques et j\'ouvre l\'œil !',
          'En formation serrée, personne ne passera !',
          'Je vous couvre ! Direction l\'objectif !'
        ];
      } else {
        lines = [
          'Bien reçu commandant, je me cale sur votre position !',
          'En formation, je surveille vos flancs !',
          'Ralliement en cours. Prêt pour le contact !'
        ];
      }
      break;

    case 'hold':
      if (isDebug) {
        lines = [
          'Périmètre gelé. Surveillance statique à 360 degrés.',
          'Ancrage défensif terminé. Aucun angle mort autorisé.',
          'Position verrouillée. Analyse des points d\'approche en cours.'
        ];
      } else {
        lines = [
          'Position verrouillée ! Je tiens le secteur coûte que coûte !',
          'Secteur sous contrôle, quiconque s\'approche sera neutralisé !',
          'Je prends position ici et je sécurise le point !'
        ];
      }
      break;

    case 'attack':
      if (isSniper) {
        lines = [
          'Cible verrouillée dans ma mire. Neutralisation en cours.',
          'Hostile ciblé. Prise de ligne à longue distance.',
          'Cible engagée. Un tir, un résultat.'
        ];
      } else if (isCombat) {
        lines = [
          'Assaut général ! Feu à volonté sur l\'objectif !',
          'Contact confirmé, j\'enfonce leurs lignes !',
          'Pas de quartier ! Assaut coordonné immédiat !'
        ];
      } else {
        lines = [
          'Cible prioritaire identifiée ! Assaut immédiat !',
          'Feu nourri ordonné ! J\'engage le combat !',
          'Ordre d\'assaut bien reçu, offensive lancée !'
        ];
      }
      break;

    case 'heal':
      if (isDebug) {
        lines = [
          'Régression de santé détectée : activation du patch de soin.',
          'Mise à couvert d\'urgence. Reconstitution du bouclier en cours.',
          'Repli stratégique : temporisation des paramètres vitaux.'
        ];
      } else {
        lines = [
          'Repli tactique ! Je trouve un abri pour me soigner !',
          'Bouclier au plus bas, je me stabilise !',
          'Je décroche un instant pour recharger mes réserves !'
        ];
      }
      break;

    case 'scavenge':
      if (isDebug) {
        lines = [
          'Scan des conteneurs alentour. Détection de ressources optimisées.',
          'Fouille du secteur : optimisation de l\'inventaire en cours.',
          'Recherche de matériel tactique lancée.'
        ];
      } else {
        lines = [
          'Reconnaissance lancée, je ratisse le secteur pour du butin !',
          'Je fouille les caisses et je vous signale l\'équipement !',
          'Inspection du périmètre à la recherche de ravitaillement !'
        ];
      }
      break;
    }

    const text = lines[Math.floor(Math.random() * lines.length)];
    this.broadcastVoice(agent, text, 'order', true);
  }

  public sayEnemySpotted(agent: AIAgentConfig | undefined, enemyName?: string) {
    const lines = [
      enemyName ? `Contact hostile : ${enemyName} en approche rapide !` : 'Contact hostile en approche rapide !',
      'Attention commandant, ennemi repéré dans le secteur !',
      'Hostile identifié ! Tenez-vous prêts !',
      'Mouvement suspect détecté droit devant !'
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.broadcastVoice(agent, text, 'enemy', false);
  }


  public sayShieldBroken(agent: AIAgentConfig | undefined) {
    const lines = [
      'Alerte ! Mon bouclier a sauté !',
      'Bouclier brisé, je prends cher !',
      'Blindage détruit, je manœuvre d\'esquive !'
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.broadcastVoice(agent, text, 'shield', true);
  }

  public sayKillConfirmed(agent: AIAgentConfig | undefined) {
    const lines = [
      'Cible neutralisée ! Un hostile de moins !',
      'Élimination confirmée ! Bien joué l\'équipe !',
      'Cible au sol net ! Secteur temporairement sécurisé !'
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.broadcastVoice(agent, text, 'kill', false);
  }

  public sayStormWarning(agent: AIAgentConfig | undefined, weatherName?: string) {
    const text = weatherName 
      ? `Alerte météo extrême : ${weatherName} en approche !` 
      : 'La zone rétrécit, convergeons vers le cercle sûr !';
    this.broadcastVoice(agent, text, 'storm', false);
  }
}

export const voiceComms = new VoiceCommsService();
