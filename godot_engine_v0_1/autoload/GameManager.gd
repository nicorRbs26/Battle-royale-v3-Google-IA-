# ============================================================================
# Description : Gestionnaire central de l'état du jeu, du mode debug et du cycle de vie
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name GameManager
extends Node

## Signaux de cycle de vie du moteur
signal game_state_changed(old_state: GameState, new_state: GameState)
signal debug_mode_toggled(is_active: bool)
signal fps_updated(current_fps: int)

## États du moteur de jeu
enum GameState {
	BOOT,
	MAIN_MENU,
	LOADING,
	PLAYING,
	PAUSED,
	GAME_OVER
}

## Propriétés de fonctionnement
var current_state: GameState = GameState.BOOT
var is_debug_active: bool = false
var engine_version: String = "BR Engine V0.1.0-alpha"
var target_fps: int = 60
var is_android: bool = false

## Statistiques de partie en cours
var match_timer: float = 0.0
var alive_players_count: int = 100
var player_kills: int = 0

func _ready() -> void:
	# S'assurer que le GameManager continue de tourner même en pause
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	# Détection de la plateforme d'exécution
	is_android = OS.get_name() == "Android"
	
	# Configuration de la fréquence de rafraîchissement cible
	Engine.max_fps = target_fps
	
	print_rich("[color=green][BR Engine V0.1][/color] GameManager initialisé avec succès sur " + OS.get_name())
	change_state(GameState.MAIN_MENU)

func _process(delta: float) -> void:
	if current_state == GameState.PLAYING:
		match_timer += delta

func _unhandled_input(event: InputEvent) -> void:
	# Touche F3 ou bouton debug pour activer le panneau d'analyse
	if event.is_action_pressed("toggle_debug") or (event is InputEventKey and event.pressed and event.keycode == KEY_F3):
		toggle_debug_mode()
	
	# Touche Échap / Start pour la pause
	if event.is_action_pressed("ui_cancel") and current_state == GameState.PLAYING:
		toggle_pause()

## Bascule le mode Pause
func toggle_pause() -> void:
	if current_state == GameState.PLAYING:
		change_state(GameState.PAUSED)
		get_tree().paused = true
	elif current_state == GameState.PAUSED:
		change_state(GameState.PLAYING)
		get_tree().paused = false

## Change l'état général du moteur
func change_state(new_state: GameState) -> void:
	if current_state == new_state:
		return
		
	var old_state = current_state
	current_state = new_state
	emit_signal("game_state_changed", old_state, new_state)
	print_rich("[color=cyan][GameManager][/color] Changement d'état: " + GameState.keys()[old_state] + " -> " + GameState.keys()[new_state])

## Active ou désactive les informations de debug et les boîtes de collision
func toggle_debug_mode() -> void:
	is_debug_active = !is_debug_active
	get_tree().debug_collisions_hint = is_debug_active
	emit_signal("debug_mode_toggled", is_debug_active)
	print("[BR Engine V0.1] Debug Mode: " + str(is_debug_active))

## Réinitialise la session de jeu
func reset_match_data() -> void:
	match_timer = 0.0
	alive_players_count = 100
	player_kills = 0
