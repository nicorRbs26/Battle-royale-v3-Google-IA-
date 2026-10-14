# Plan d'implémentation : Amélioration de l'affichage mobile, adaptation à la rotation et plein écran natif

## Objectifs
1. **Plein écran natif (Fullscreen API)** : Intégrer un bouton de bascule plein écran intuitif dans le menu principal et le HUD en jeu pour maximiser l'espace d'affichage sur smartphone.
2. **Adaptation responsive Portrait / Paysage** :
   - Détection dynamique de l'orientation de l'écran (`window.matchMedia` / `resize`).
   - Ajustement automatique de la disposition du HUD (`GameHUD.tsx`), des contrôles tactiles virtuels (`TouchHUDCustomizer.tsx`) et du menu principal (`MainMenu.tsx`).
   - Redimensionnement fluide du canvas de jeu en fonction de l'espace disponible selon que l'appareil est en portrait ou en paysage.

## Étapes de réalisation
1. **Service / Utilitaire Plein Écran** :
   - Créer ou intégrer une fonction helper `toggleFullscreen()` gérant l'API Fullscreen du navigateur avec repli propre.
2. **Mise à jour du Menu Principal (`MainMenu.tsx`)** :
   - Ajouter un bouton "Plein écran" bien visible en haut de l'interface mobile.
   - Assurer un design fluide et empilé en orientation portrait, et étendu en paysage.
3. **Mise à jour du HUD de Jeu (`GameHUD.tsx`) & Contrôles Tactiles (`TouchHUDCustomizer.tsx`)** :
   - Détecter les changements d'orientation et adapter la disposition des joysticks, boutons de tir, kits de soin et minimap.
   - Ajouter le bouton de bascule plein écran dans les options rapides en jeu.
4. **Vérification et Compilation** :
   - Compiler l'application et valider l'absence d'erreurs de build.
