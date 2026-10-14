# 🎮 Battle Royale Engine V0.1 (Godot 4.5+)

Moteur de jeu Battle Royale professionnel, modulaire, optimisé pour PC (Windows / Linux) et mobiles (Android 60 FPS target).

---

## 📁 Architecture du Projet

```text
res://
├── core/
│   └── (Classes fondamentales de boucle de jeu)
├── autoload/
│   ├── GameManager.gd      # Autoload: État du jeu, boucle principale, F3 Debug
│   ├── SceneManager.gd      # Autoload: Chargement asynchrone multithread
│   ├── InputManager.gd      # Autoload: Input mapping (Clavier, Souris, Tactile)
│   ├── AudioManager.gd      # Autoload: Bus Master/Music/SFX + Audio Pool
│   ├── SaveManager.gd       # Autoload: Sauvegarde JSON chiffrée
│   └── SettingsManager.gd   # Autoload: Résolution, VSync, Volumes, Qualité
├── player/
│   └── Player.gd            # Déplacements fluides, stamina, collisions, visée
├── camera/
│   └── SmoothCamera.gd      # Suivi amorti, zoom dynamique, screen shake
├── world/
│   └── TestMap.gd           # Terrain de test, objets, zone de tempête
├── ui/
│   ├── MainMenu.gd          # Logo, Jouer, Paramètres, Quitter
│   ├── SettingsMenu.gd      # Réglages graphiques et audio
│   └── HUD.gd               # FPS, Position X/Y, Ping, Version Engine
├── debug/
│   └── DebugOverlay.gd      # Panneau F3, Mémoire statique, Draw calls, Collisions
├── managers/
│   ├── ObjectPoolManager.gd # Object Pooling zéro allo
│   └── MapStreamManager.gd  # Préparation au streaming de carte (V0.2+)
└── configs/
    └── engine_config.json
```

---

## ⚡ Caractéristiques V0.1

1. **Architecture Autoload Complete** : 6 Singleton Managers indépendants.
2. **Support Android Native** : Mode tactile automatique avec émulation joystick & boutons virtuels.
3. **Moteur Graphique & FPS** : Target 60 FPS garantis avec suivi mémoire statique sous 50 Mo.
4. **Panneau Debug F3** : Affichage temps réel des FPS, coordonnées, allocations mémoire (`OS.get_static_memory_usage()`), et lignes de collisions.
5. **Préparation V0.2** : Object Pooling et découpage par Chunks pré-intégrés.

---

## 🚀 Utilisation dans Godot 4.5+

1. Téléchargez ou clonez le dossier `godot_engine_v0_1`.
2. Lancez **Godot Engine 4.5+**.
3. Cliquez sur **Importer** et sélectionnez `project.godot`.
4. Pressez **F5** pour exécuter le moteur.
