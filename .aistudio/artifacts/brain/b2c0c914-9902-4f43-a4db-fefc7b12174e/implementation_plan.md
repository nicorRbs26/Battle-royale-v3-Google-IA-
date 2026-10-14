# Plan d'Implémentation : Météo & Carte Dynamique, Roue d'Ordres Tactiques & Synthèse Vocale Radio IA

Amélioration globale de l'expérience de jeu combinant une refonte graphique des biomes et de la météo atmosphérique, une roue de commandement tactique pour diriger l'escouade d'agents IA, et un système de transmission vocale radio synthétisée en temps réel via l'API Web Speech.

## Décisions Clés & Alignement Utilisateur

> [!IMPORTANT]
> Choix confirmés lors de la phase de cadrage :
> 1. **Priorité Graphismes & Environnement** : Météo dynamique avancée (effets d'éclairage, flash d'orage, blizzard, particules fluides) et génération de carte enrichie en biomes et points d'intérêt.
> 2. **Mécanique de Gameplay Maîtresse** : Roue radiale d'ordres tactiques (`T` / `C` / clic molette / bouton tactile) pour ordonner en temps réel aux coéquipiers IA d'attaquer, défendre, suivre ou fouiller.
> 3. **Rôle des Agents IA Google Drive** : Voix et alertes tactiques contextualisées diffusées en direct par synthèse vocale (Web Speech API) avec retours radio immersifs et sous-titres HUD discrets.

---

## 1. Vue d'Ensemble & Concept

### Qu'est-ce que cette mise à jour apporte ?
- **Atmosphère Visuelle & Météo Réactive** : Le terrain de combat s'anime avec des cycles météo riches (pluie d'acide battante avec éclairs qui illuminent le brouillard de guerre, tempête de sable dense avec grains tourbillonnants, blizzard de givre avec ralentissement au sol). La carte intègre de nouveaux complexes tactiques (station radar, bunker de commandement, zones de cratère).
- **Roue de Commandement Tactique** : Le joueur peut maintenir une touche pour faire apparaître un menu circulaire semi-transparent permettant d'assigner des ordres directs à ses alliés IA.
- **Transmissions Radio Vocales de l'Agent IA** : L'agent IA sélectionné (importé depuis Google Drive ou preset) communique oralement au joueur les informations cruciales : détection d'ennemis en approche, statut de l'armure brisée, confirmation des ordres donnés et alerte de zone radioactive.

---

## 2. Expérience Utilisateur & Design Visuel

### A. Flux Utilisateur & Ergonomie
1. **En combat libre** : L'environnement affiche des teintes adaptées au climat en cours (ombres projetées, réverbération lumineuse lors des éclairs d'orage, particules de vent).
2. **Déploiement de la Roue d'Ordres** :
   - *PC* : Maintien de la touche `T` ou clic sur la molette souris -> affichage instantané de la roue radiale centrée avec 5 cadrans : **Suivre & Couvrir**, **Attaquer Cible**, **Tenir Position**, **Repli & Soins**, **Fouiller Zone**. Le temps de réaction est de < 50ms, avec surbrillance au survol.
   - *Mobile* : Bouton circulaire dédié "Tactique" au-dessus du joystick de visée ouvrant la roue au pouce.
3. **Réaction et Transmission Vocale** :
   - Dès qu'un ordre est validé, un marqueur visuel apparaît dans le monde (balise animée) et les coéquipiers confirment par la voix synthétisée (*"Compris Chef, je sécurise la position !"*).
   - Un sous-titre radio discret s'affiche en haut de l'écran avec le portrait de l'agent IA.

### B. Identité Visuelle & Charte Graphique (frontend-design & 60-30-10)
- **Palette Neutre & Tactique** :
  - `60% Canvas & Fond` : Slate sombre ardoise (`#090D16`), textures de sol texturées avec micro-reliefs.
  - `30% Structures & HUD` : Panneaux translucides fumés (`rgba(15, 23, 42, 0.85)`), séparateurs subtils en hairline (`border-slate-800`), typographie nette sans pilules décoratives superflues.
  - `10% Accents d'Alerte` : Ambre tactique (`#F59E0B`), cyan radar (`#06B6D4`), et vert santé (`#10B981`) pour les pings d'ordres.
- **Roue Radiale Tactique** :
  - Découpe en secteurs circulaires SVG avec icônes unifiées.
  - Absence de badges gadgets ou de faux compteurs techniques artificiels.
  - Transition douce en opacité et échelle (`transform scale`, `opacity`) respectant le budget de réactivité (< 150ms).

---

## 3. Décisions Produits & Compromis Techniques

| Décision | Solution Retenue | Justification |
| :--- | :--- | :--- |
| **Synthèse Vocale des Agents** | `window.speechSynthesis` natif (Web Speech API) avec voix FR/EN locale et fallback beeps Web Audio | Latence zéro (instantané), ne consomme pas de quota d'API externe, fonctionne hors-ligne. Possibilité de mute en 1 clic dans le HUD. |
| **Rendu Météo & Éclairages** | Canvas overlay 2D optimisé avec canvas hors-écran (*offscreen*) pour les couches de brouillard | Rendu à 60 FPS constant sans surcharge du GPU, compatible ordinateurs modestes et smartphones. |
| **Prise en Compte des Ordres IA** | Extension directe de la machine d'état des bots dans `App.tsx` (`follow_player`, `hold_position`, `assault_target`, `scavenge`) | Les bots réagissent immédiatement à la consigne du joueur tout en conservant leurs routines d'évitement d'obstacles et de tir précis. |

---

## 4. Architecture Technique & Diagramme Système

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Main Game Loop)                        │
└───────┬──────────────────────────────────┬──────────────────────┬──────┘
        │                                  │                      │
        ▼                                  ▼                      ▼
┌──────────────────┐             ┌───────────────────┐  ┌───────────────────┐
│ WeatherSystem    │             │ TacticalWheel     │  │ VoiceCommsService │
│ - Particle loops │             │ - Radial UI (5)   │  │ - Web Speech API  │
│ - Ambient lights │             │ - Ping markers    │  │ - Radio filter FX │
│ - Lightning flash│             │ - Mouse/touch drag│  │ - Bot chat bubble │
└───────┬──────────┘             └─────────┬─────────┘  └─────────┬─────────┘
        │                                  │                      │
        ▼                                  ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│      Bot Decision Engine (Extended AI States & Tactical Waypoints)     │
│   'follow_player' · 'hold_position' · 'assault_target' · 'scavenge'    │
└────────────────────────────────────────────────────────────────────────┘
```

### Entités & Données Clés
1. **`TacticalOrder`** :
   ```typescript
   export type TacticalOrderType = 'follow' | 'attack' | 'hold' | 'heal' | 'scavenge';
   export interface TacticalPing {
     id: string;
     type: TacticalOrderType;
     x: number;
     y: number;
     createdAt: number;
     label: string;
   }
   ```
2. **`WeatherState`** :
   - Types étendus : `'none' | 'acid_rain' | 'sandstorm' | 'magma_comets' | 'thunderstorm' | 'blizzard'`
   - Propriétés : `intensity: number`, `ambientColor: string`, `lightningFlash: number` (0 à 1)
3. **`SquadVoiceLine`** :
   - Événements déclencheurs : `order_received`, `enemy_spotted`, `shield_broken`, `storm_warning`, `victory_kill`
   - Déclenchement throttlé (minimum 4 secondes entre deux répliques pour éviter la saturation auditive).

---

## 5. Plan d'Implémentation Étape par Étape

1. **Service de Synthèse Vocale Tactique (`src/services/voiceComms.ts`)** :
   - Moteur de synthèse vocale avec choix de langue, modulation de hauteur/vitesse selon l'agent IA actif.
   - Banque de répliques contextuelles en français avec fallback sous-titres visuels.
   - Contrôle du volume et bouton silencieux dans les paramètres du GameHUD.
2. **Composant UI Roue Radiale Tactique (`src/components/TacticalWheel.tsx`)** :
   - Roue radiale avec 5 sections tactiques clairement identifiables.
   - Support clavier (`T` ou `C`), souris (clic molette ou drag) et mobile (bouton flottant tactile).
3. **Moteur Météo & Éclairage Dynamique (`src/game/weather.ts` & canvas render)** :
   - Intégration de l'orage électrique avec illumination globale soudaine et sons de tonnerre.
   - Particules de pluie et de vent réactives à la position de la caméra.
   - Décoration procédurale des cartes avec nouvelles structures défensives et points d'intérêt tactiques.
4. **Mise à Jour de l'IA des Bots Coéquipiers** :
   - Prise en charge des waypoints ordonnés par le joueur dans la boucle de décision IA.
   - Rapprochement en formation ou prise de couverture ciblée.
5. **Tests & Validation** :
   - Tests unitaires Vitest pour la gestion des ordres et de la machine à états IA.
   - Compilation TypeScript sans faute et vérification ESLint.
