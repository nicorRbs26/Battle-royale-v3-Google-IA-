# Implementation Plan - Amélioration des graphiques (Textures et Environnement)

## User Request
- **Améliorer les graphiques (textures, environnement)**
- **Niveau de détails pour les textures du sol et des décors** : Sol texturé procédural riche et détails dynamiques

---

## Proposed Changes

### 1. Amélioration des Textures du Sol et Procédurales (`src/utils.ts` & `src/App.tsx`)
- Enrichir le rendu des tuiles de sol (`EnvironmentalTile`, `ArenaType`) avec des motifs procéduraux riches selon l'arène (forêt militaire avec feuillage et mousses, cyberpunk avec dalles lumineuses et circuits imprimés, désert avec dunes de sable texturées, île volcanique avec fissures de lave).
- Ajouter des textures de grille fine et de micro-détails (gravillons, débris, fissures) calculées par motif procédural sans perte de performance.

### 2. Détails Environnementaux Dynamiques (`src/App.tsx`)
- **Particules environnementales dynamiques** : poussière flottante, spores lumineuses, feuilles/cendre en suspension selon l'arène.
- **Effets visuels au sol** : empreintes de pas ou traces de dash, ondulations d'eau/boue sous les pas, éclats d'impacts de balles persistants, cratères de grenades texturés.
- **Éléments de décor interactifs et animés** : arbres/buissons qui s'écartent ou bougent lors du passage ou des explosions, torches/phares lumineux oscillants, effets de distorsion thermique ou de brouillard volumétrique.

### 3. Polish Visuel et Éclairage (`src/App.tsx` & Rendu Canvas)
- Ajout d'ombres portées dynamiques douces sous les personnages, véhicules et structures.
- Effets de post-processing 2D (vignettage atmosphérique, lueur néon "bloom" simulée pour les éléments lumineux, flashs de tirs illuminant le sol environnant).

---

## Verification Plan

### Automated Tests
- Exécuter `compile_applet` pour valider l'absence d'erreurs de compilation TypeScript / JSX.
- Exécuter `lint_applet` pour vérifier la propreté du code.

### Manual Verification
- Lancer une partie en mode solo / arène aléatoire et vérifier la richesse visuelle des textures de sol et des effets dynamiques d'environnement.
