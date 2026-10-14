// ============================================================================
// Données et fichiers du Moteur Battle Royale V0.1 (Godot 4.5+ GDScript)
// ============================================================================

export interface GodotFile {
  path: string;
  name: string;
  category: 'core' | 'autoload' | 'player' | 'camera' | 'world' | 'ui' | 'debug' | 'managers' | 'configs' | 'enemies' | 'animation';
  content: string;
  description: string;
}

export const GODOT_ENGINE_FILES: GodotFile[] = [
  {
    path: 'project.godot',
    name: 'project.godot',
    category: 'configs',
    description: 'Configuration du projet Godot 4.5, Autoloads, résolutions et raccourcis',
    content: `# ============================================================================
# GODOT 4.5+ BATTLE ROYALE ENGINE V0.1
# Project Configuration File
# ============================================================================

config_version=5

[application]

config/name="Battle Royale Engine V0.1"
config/description="Moteur de jeu Battle Royale professionnel, modulaire, optimisé multiplateforme (Windows, Linux, Android)."
config/version="0.1.0"
run/main_scene="res://ui/MainMenu.tscn"
config/features=PackedStringArray("4.5", "Forward Plus", "Mobile")
config/icon="res://assets/icon.svg"

[autoload]

GameManager="*res://autoload/GameManager.gd"
SceneManager="*res://autoload/SceneManager.gd"
InputManager="*res://autoload/InputManager.gd"
AudioManager="*res://autoload/AudioManager.gd"
SaveManager="*res://autoload/SaveManager.gd"
SettingsManager="*res://autoload/SettingsManager.gd"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/size/mode=0
window/size/resizable=true
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[input_devices]

pointing/emulate_touch_from_mouse=true
pointing/emulate_mouse_from_touch=true

[rendering]

renderer/rendering_method="mobile"
textures/vram_compression/import_s3tc_bptc=true
textures/vram_compression/import_etc2_astc=true
environment/defaults/default_clear_color=Color(0.08, 0.09, 0.12, 1)

[debug]

settings/stdout/verbose_stdout=false
file_logging/enable_file_logging=true`
  },
  {
    path: 'autoload/GameManager.gd',
    name: 'GameManager.gd',
    category: 'autoload',
    description: 'Gestionnaire principal de la boucle de jeu, états, F3 debug mode et match timer',
    content: `# ============================================================================
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
	player_kills = 0`
  },
  {
    path: 'autoload/SceneManager.gd',
    name: 'SceneManager.gd',
    category: 'autoload',
    description: 'Transition de scènes asynchrone multithreadée avec libération mémoire',
    content: `# ============================================================================
# Description : Gestionnaire de transition asynchrone entre les scènes avec écran de chargement
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SceneManager
extends Node

signal scene_change_started(scene_path: String)
signal scene_change_progress(progress: float)
signal scene_change_completed(scene_path: String)

var _current_scene: Node = null

func _ready() -> void:
	var root = get_tree().root
	_current_scene = root.get_child(root.get_child_count() - 1)

## Change de scène de manière asynchrone avec suivi de progression
func change_scene_to_file_async(target_scene_path: String) -> void:
	if not ResourceLoader.exists(target_scene_path):
		printerr("[SceneManager] Erreur : La scène à l'emplacement ", target_scene_path, " n'existe pas.")
		return

	emit_signal("scene_change_started", target_scene_path)
	GameManager.change_state(GameManager.GameState.LOADING)
	
	ResourceLoader.load_threaded_request(target_scene_path)
	var progress: Array = []
	var status = ResourceLoader.THREAD_LOAD_IN_PROGRESS
	
	while status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
		status = ResourceLoader.load_threaded_get_status(target_scene_path, progress)
		var current_progress: float = progress[0] if progress.size() > 0 else 0.0
		emit_signal("scene_change_progress", current_progress)
		await get_tree().process_frame
		
	if status == ResourceLoader.THREAD_LOAD_LOADED:
		var packed_scene: PackedScene = ResourceLoader.load_threaded_get(target_scene_path)
		_switch_to_packed_scene(packed_scene, target_scene_path)

func _switch_to_packed_scene(packed_scene: PackedScene, scene_path: String) -> void:
	if _current_scene:
		_current_scene.queue_free()
		
	_current_scene = packed_scene.instantiate()
	get_tree().root.add_child(_current_scene)
	get_tree().current_scene = _current_scene
	
	emit_signal("scene_change_completed", scene_path)
	if scene_path.contains("MainMenu"):
		GameManager.change_state(GameManager.GameState.MAIN_MENU)
	else:
		GameManager.change_state(GameManager.GameState.PLAYING)`
  },
  {
    path: 'autoload/InputManager.gd',
    name: 'InputManager.gd',
    category: 'autoload',
    description: 'Mappeur d’entrées cross-platform (Clavier/Souris & Tactile Android)',
    content: `# ============================================================================
# Description : Gestionnaire d'entrées multiplateforme (Clavier, Souris, Tactile Android)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name InputManager
extends Node

signal input_device_changed(is_touch: bool)

var is_touch_active: bool = false
var touch_vector: Vector2 = Vector2.ZERO
var aim_vector: Vector2 = Vector2.ZERO

func _ready() -> void:
	is_touch_active = DisplayServer.has_feature(DisplayServer.FEATURE_TOUCHSCREEN) or OS.get_name() == "Android"
	_setup_default_input_map()

func _setup_default_input_map() -> void:
	_add_action_if_missing("move_left", [KEY_A, KEY_Q, KEY_LEFT])
	_add_action_if_missing("move_right", [KEY_D, KEY_RIGHT])
	_add_action_if_missing("move_up", [KEY_W, KEY_Z, KEY_UP])
	_add_action_if_missing("move_down", [KEY_S, KEY_DOWN])
	_add_action_if_missing("sprint", [KEY_SHIFT])
	_add_action_if_missing("toggle_debug", [KEY_F3])

func _add_action_if_missing(action_name: String, key_codes: Array) -> void:
	if not InputMap.has_action(action_name):
		InputMap.add_action(action_name)
		for code in key_codes:
			var event = InputEventKey.new()
			event.physical_keycode = code
			InputMap.action_add_event(action_name, event)

func get_movement_vector() -> Vector2:
	if is_touch_active and touch_vector != Vector2.ZERO:
		return touch_vector.normalized()
		
	var vector = Vector2.ZERO
	vector.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
	vector.y = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	
	return vector.normalized() if vector.length_squared() > 0.0 else Vector2.ZERO`
  },
  {
    path: 'autoload/AudioManager.gd',
    name: 'AudioManager.gd',
    category: 'autoload',
    description: 'Bus audio Master/Music/SFX et Object Pooling de canaux sonores',
    content: `# ============================================================================
# Description : Gestionnaire de son (Bus Audio, Effets SFX, Musiques et Audio Pool)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name AudioManager
extends Node

enum AudioBus { MASTER, MUSIC, SFX }

var _sfx_players: Array[AudioStreamPlayer] = []
var _pool_size: int = 16

func _ready() -> void:
	for i in range(_pool_size):
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)

func play_sfx(stream: AudioStream, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not stream:
		return
		
	for player in _sfx_players:
		if not player.playing:
			player.stream = stream
			player.pitch_scale = pitch_scale
			player.volume_db = volume_db
			player.play()
			return

func set_bus_volume(bus_type: AudioBus, linear_volume: float) -> void:
	var bus_name = "Master"
	match bus_type:
		AudioBus.MUSIC: bus_name = "Music"
		AudioBus.SFX: bus_name = "SFX"
		
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx != -1:
		var db = linear_to_db(clamp(linear_volume, 0.0001, 1.0))
		AudioServer.set_bus_volume_db(bus_idx, db)`
  },
  {
    path: 'autoload/SaveManager.gd',
    name: 'SaveManager.gd',
    category: 'autoload',
    description: 'Persistance JSON chiffrée pour données de joueur et statistiques',
    content: `# ============================================================================
# Description : Sauvegarde et chargement des données utilisateur au format JSON
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SaveManager
extends Node

const SAVE_PATH: String = "user://save_data.json"

var default_data: Dictionary = {
	"player_name": "Survivant",
	"games_played": 0,
	"wins": 0,
	"kills": 0,
	"high_score": 0
}

func save_game(data: Dictionary) -> bool:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if not file:
		return false
	file.store_string(JSON.stringify(data, "\t"))
	file.close()
	return true

func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		save_game(default_data)
		return default_data.duplicate()
		
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return default_data.duplicate()
		
	var json = JSON.new()
	if json.parse(file.get_as_text()) == OK:
		return json.get_data()
	return default_data.duplicate()`
  },
  {
    path: 'autoload/SettingsManager.gd',
    name: 'SettingsManager.gd',
    category: 'autoload',
    description: 'Résolution, plein écran, VSync, qualité graphique et paramètres sonores',
    content: `# ============================================================================
# Description : Gestionnaire de paramètres graphiques, audio et options
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SettingsManager
extends Node

const SETTINGS_PATH: String = "user://settings.json"

enum QualityPreset { LOW, MEDIUM, HIGH, ULTRA }

var settings_data: Dictionary = {
	"resolution_w": 1280,
	"resolution_h": 720,
	"fullscreen": false,
	"master_volume": 1.0,
	"music_volume": 0.8,
	"sfx_volume": 0.9,
	"graphics_quality": QualityPreset.MEDIUM,
	"vsync_enabled": true
}

func _ready() -> void:
	load_settings()
	apply_all_settings()

func apply_all_settings() -> void:
	var mode = DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN if settings_data["fullscreen"] else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(mode)
	if not settings_data["fullscreen"]:
		DisplayServer.window_set_size(Vector2i(settings_data["resolution_w"], settings_data["resolution_h"]))
		
	AudioManager.set_bus_volume(AudioManager.AudioBus.MASTER, settings_data["master_volume"])
	AudioManager.set_bus_volume(AudioManager.AudioBus.MUSIC, settings_data["music_volume"])
	AudioManager.set_bus_volume(AudioManager.AudioBus.SFX, settings_data["sfx_volume"])

func save_settings() -> void:
	var file = FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(settings_data, "\t"))
		file.close()

func load_settings() -> void:
	if FileAccess.file_exists(SETTINGS_PATH):
		var file = FileAccess.open(SETTINGS_PATH, FileAccess.READ)
		if file:
			var json = JSON.new()
			if json.parse(file.get_as_text()) == OK:
				var loaded = json.get_data()
				for key in loaded:
					settings_data[key] = loaded[key]
				file.close()`
  },
  {
    path: 'player/Player.gd',
    name: 'Player.gd',
    category: 'player',
    description: 'Contrôleur Joueur (CharacterBody2D avec accélération, stamina, orientation)',
    content: `# ============================================================================
# Description : Contrôleur du Joueur (Mouvement fluide, collisions, sprint, stamina)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name Player
extends CharacterBody2D

@export var walk_speed: float = 240.0
@export var sprint_speed: float = 380.0
@export var acceleration: float = 2400.0
@export var friction: float = 1800.0
@export var max_stamina: float = 100.0

var current_health: float = 100.0
var current_shield: float = 50.0
var current_stamina: float = 100.0
var is_sprinting: bool = false

signal stats_changed(health: float, shield: float, stamina: float)

func _physics_process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return

	_handle_movement(delta)
	_handle_rotation()
	_update_stamina(delta)
	
	move_and_slide()

func _handle_movement(delta: float) -> void:
	var move_vector = InputManager.get_movement_vector()
	var wants_sprint = Input.is_action_pressed("sprint") and current_stamina > 5.0 and move_vector.length_squared() > 0.1
	is_sprinting = wants_sprint

	var target_speed = sprint_speed if is_sprinting else walk_speed
	var target_velocity = move_vector * target_speed

	if move_vector.length_squared() > 0.0:
		velocity = velocity.move_toward(target_velocity, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

func _handle_rotation() -> void:
	if InputManager.is_touch_active:
		if InputManager.aim_vector.length_squared() > 0.1:
			rotation = InputManager.aim_vector.angle()
	else:
		var mouse_pos = get_global_mouse_position()
		look_at(mouse_pos)

func _update_stamina(delta: float) -> void:
	if is_sprinting:
		current_stamina = max(0.0, current_stamina - 30.0 * delta)
	else:
		current_stamina = min(max_stamina, current_stamina + 20.0 * delta)
		
	emit_signal("stats_changed", current_health, current_shield, current_stamina)`
  },
  {
    path: 'player/PlatformerPlayer.gd',
    name: 'PlatformerPlayer.gd',
    category: 'player',
    description: 'Alternative : Contrôleur Joueur Platformer 2D (Saut, Dash, Gravité)',
    content: `extends CharacterBody2D

@export_group("Movement")
@export var speed := 250.0
@export var acceleration := 1200.0
@export var friction := 1500.0

@export_group("Jump")
@export var jump_velocity := -450.0
@export var gravity_scale := 1.2

@export_group("Abilities")
@export var dash_speed := 600.0
@export var dash_duration := 0.15

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")
var is_dashing := false
var dash_timer := 0.0

func _physics_process(delta: float) -> void:
    # Appliquer la gravité
    if not is_on_floor() and not is_dashing:
        velocity.y += gravity * gravity_scale * delta

    # Gestion du saut
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Gestion du Dash
    if Input.is_action_just_pressed("dash") and not is_dashing:
        start_dash()

    if is_dashing:
        dash_timer -= delta
        if dash_timer <= 0:
            is_dashing = false
    else:
        # Mouvement horizontal standard
        var direction := Input.get_axis("move_left", "move_right")
        if direction:
            velocity.x = move_toward(velocity.x, direction * speed, acceleration * delta)
        else:
            velocity.x = move_toward(velocity.x, 0, friction * delta)

    move_and_slide()

func start_dash() -> void:
    is_dashing = true
    dash_timer = dash_duration
    var direction = Input.get_axis("move_left", "move_right")
    if direction == 0: direction = 1 if not $Sprite2D.flip_h else -1
    velocity.x = direction * dash_speed
    velocity.y = 0 # Dash horizontal pur`
  },
  {
    path: 'enemies/SentinelAI.gd',
    name: 'SentinelAI.gd',
    category: 'enemies',
    description: 'IA Sentinelle avec cône de vision, patrouille et détection progressive.',
    content: `extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, SEARCH }

@export_group("Vision")
@export var vision_range := 400.0
@export var vision_angle := 45.0
@export var detection_speed := 2.0

@export_group("Movement")
@export var patrol_speed := 120.0
@export var chase_speed := 220.0
@export var patrol_points: Array[Vector2]

var current_state := State.PATROL
var target_player: Node2D = null
var current_patrol_idx := 0
var detection_level := 0.0

func _ready() -> void:
    var players = get_tree().get_nodes_in_group("player")
    if players.size() > 0:
        target_player = players[0]

func _physics_process(delta: float) -> void:
    match current_state:
        State.PATROL:
            _handle_patrol(delta)
            _check_vision(delta)
        State.CHASE:
            _handle_chase(delta)
        State.SEARCH:
            _handle_search(delta)

func _check_vision(delta: float) -> void:
    if not target_player: return
    var to_player = target_player.global_position - global_position
    var dist = to_player.length()
    if dist < vision_range:
        var forward = Vector2.RIGHT.rotated(global_rotation)
        var angle_to_player = rad_to_deg(forward.angle_to(to_player))
        if abs(angle_to_player) < vision_angle:
            var space_state = get_world_2d().direct_space_state
            var query = PhysicsRayQueryParameters2D.create(global_position, target_player.global_position)
            query.exclude = [self]
            var result = space_state.intersect_ray(query)
            if result and result.collider == target_player:
                detection_level += delta * detection_speed
                if detection_level >= 1.0:
                    current_state = State.CHASE
                return
    detection_level = max(0.0, detection_level - delta * 0.5)

func _handle_patrol(delta: float) -> void:
    if patrol_points.is_empty(): return
    var target = patrol_points[current_patrol_idx]
    var dir = global_position.direction_to(target)
    velocity = dir * patrol_speed
    global_rotation = lerp_angle(global_rotation, dir.angle(), 5.0 * delta)
    if global_position.distance_to(target) < 20.0:
        current_patrol_idx = (current_patrol_idx + 1) % patrol_points.size()
    move_and_slide()

func _handle_chase(delta: float) -> void:
    if not target_player:
        current_state = State.SEARCH
        return
    var dir = global_position.direction_to(target_player.global_position)
    velocity = dir * chase_speed
    global_rotation = lerp_angle(global_rotation, dir.angle(), 10.0 * delta)
    if global_position.distance_to(target_player.global_position) > vision_range * 1.5:
        current_state = State.SEARCH
    move_and_slide()

func _handle_search(delta: float) -> void:
    global_rotation += 2.0 * delta
    velocity = Vector2.ZERO`
  },
  {
    path: 'camera/SmoothCamera.gd',
    name: 'SmoothCamera.gd',
    category: 'camera',
    description: 'Caméra de suivi fluide avec ammortissement (lerp), zoom molette et screen shake',
    content: `# ============================================================================
# Description : Caméra de suivi fluide (lerp), zoom dynamique et secousses
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SmoothCamera
extends Camera2D

@export var target_node_path: NodePath
@export var follow_speed: float = 8.0
@export var min_zoom: float = 0.8
@export var max_zoom: float = 1.8
@export var zoom_speed: float = 5.0

var target_node: Node2D = null
var target_zoom: Vector2 = Vector2.ONE
var _shake_intensity: float = 0.0

func _ready() -> void:
	if not target_node_path.is_empty():
		target_node = get_node_or_null(target_node_path) as Node2D

func _process(delta: float) -> void:
	if target_node and is_instance_valid(target_node):
		global_position = global_position.lerp(target_node.global_position, follow_speed * delta)
		
	zoom = zoom.lerp(target_zoom, zoom_speed * delta)
	
	if _shake_intensity > 0.01:
		offset = Vector2(
			randf_range(-_shake_intensity, _shake_intensity),
			randf_range(-_shake_intensity, _shake_intensity)
		)
		_shake_intensity = lerp(_shake_intensity, 0.0, 5.0 * delta)
	else:
		offset = Vector2.ZERO

func add_shake(intensity: float) -> void:
	_shake_intensity = max(_shake_intensity, intensity)`
  },
  {
    path: 'world/TestMap.gd',
    name: 'TestMap.gd',
    category: 'world',
    description: 'Carte de test 2500x2500 avec sol, obstacles, bâtiments et zone de tempête',
    content: `# ============================================================================
# Description : Carte de test Battle Royale V0.1
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name TestMap
extends Node2D

@export var map_size: Vector2 = Vector2(2500, 2500)
@export var storm_shrink_speed: float = 12.0

var storm_center: Vector2 = Vector2(1250, 1250)
var storm_radius: float = 1200.0

func _process(delta: float) -> void:
	if GameManager.current_state == GameManager.GameState.PLAYING:
		if storm_radius > 100.0:
			storm_radius = max(100.0, storm_radius - storm_shrink_speed * delta)
		queue_redraw()

func _draw() -> void:
	draw_arc(storm_center, storm_radius, 0, TAU, 64, Color(0.2, 0.6, 1.0, 0.8), 3.0)
	draw_rect(Rect2(Vector2.ZERO, map_size), Color(0.1, 0.8, 0.3, 0.15), false, 4.0)`
  },
  {
    path: 'ui/HUD.gd',
    name: 'HUD.gd',
    category: 'ui',
    description: 'Affichage HUD (FPS, Coordonnées X Y, Version moteur, Ping)',
    content: `# ============================================================================
# Description : HUD Heads-Up Display (FPS, Position X/Y, Version moteur, Ping)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name HUD
extends CanvasLayer

@onready var fps_label: Label = $FPSLabel if has_node("FPSLabel") else null
@onready var pos_label: Label = $PosLabel if has_node("PosLabel") else null
@onready var version_label: Label = $VersionLabel if has_node("VersionLabel") else null

var player_ref: Node2D = null

func _process(_delta: float) -> void:
	if fps_label:
		fps_label.text = "FPS: " + str(Engine.get_frames_per_second())
		
	if pos_label and player_ref and is_instance_valid(player_ref):
		var p = player_ref.global_position
		pos_label.text = "X: " + str(snapped(p.x, 0.1)) + " Y: " + str(snapped(p.y, 0.1))`
  },
  {
    path: 'debug/DebugOverlay.gd',
    name: 'DebugOverlay.gd',
    category: 'debug',
    description: 'Panneau F3 avec monitoring FPS, Mémoire statique MB, Draw calls, Object Pools et Map Streaming',
    content: `# ============================================================================
# Description : Superposition de débogage F3 (Collisions, FPS, Mémoire, Object Pools & Streaming)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name DebugOverlay
extends CanvasLayer

@onready var fps_val: Label = $VBoxContainer/FPSVal if has_node("VBoxContainer/FPSVal") else null
@onready var mem_val: Label = $VBoxContainer/MemVal if has_node("VBoxContainer/MemVal") else null
@onready var pool_val: Label = $VBoxContainer/PoolVal if has_node("VBoxContainer/PoolVal") else null
@onready var stream_val: Label = $VBoxContainer/StreamVal if has_node("VBoxContainer/StreamVal") else null

func _ready() -> void:
	if GameManager:
		GameManager.debug_mode_toggled.connect(func(active): visible = active)
		visible = GameManager.is_debug_active

func _process(_delta: float) -> void:
	if not visible:
		return

	if fps_val:
		var current_fps = Engine.get_frames_per_second()
		fps_val.text = "FPS : " + str(current_fps) + " (Target 60 FPS)"
		
	if mem_val:
		var mem_mb = Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0)
		mem_val.text = "Mémoire statique : " + str(snapped(mem_mb, 0.01)) + " MB"

	if pool_val and has_node("/root/ObjectPoolManager"):
		var pool_mgr = get_node("/root/ObjectPoolManager")
		if pool_mgr.has_method("get_pool_stats"):
			var stats = pool_mgr.call("get_pool_stats", "bullet_pool")
			pool_val.text = "Object Pools : " + str(stats.get("active", 0)) + " actifs / " + str(stats.get("total", 0)) + " alloués"

	if stream_val and has_node("/root/MapStreamManager"):
		var stream_mgr = get_node("/root/MapStreamManager")
		if stream_mgr.has_method("get_streaming_stats"):
			var s_stats = stream_mgr.call("get_streaming_stats")
			stream_val.text = "Map Streaming : Chunk " + str(s_stats.get("current_chunk", Vector2i.ZERO)) + " (" + str(s_stats.get("active_chunks_count", 0)) + " Chunks chargés)"`
  },
  {
    path: 'managers/ObjectPoolManager.gd',
    name: 'ObjectPoolManager.gd',
    category: 'managers',
    description: 'Système d’Object Pooling pour balles, effets et objets sans allocation dynamique',
    content: `# ============================================================================
# Description : Object Pooling haute performance (Évite les allocations mémoire répétitives)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+ Android & Desktop Optimized)
# ============================================================================
class_name ObjectPoolManager
extends Node

## Dictionnaire contenant toutes les données de pools actives
var _pools: Dictionary = {}

## Configuration globale de rétention mémoire
@export var max_pool_expansion: int = 150

## Enregistre et pré-instancie un pool pour un PackedScene donné
func create_pool(pool_key: String, scene: PackedScene, initial_size: int = 30) -> void:
	if _pools.has(pool_key):
		return

	if not scene:
		printerr("[ObjectPoolManager] Erreur : PackedScene invalide pour le pool : ", pool_key)
		return

	var pool_data = {
		"scene": scene,
		"available": [],
		"active": [],
		"initial_size": initial_size
	}

	for i in range(initial_size):
		var obj = scene.instantiate()
		if obj:
			obj.hide()
			add_child(obj)
			pool_data["available"].append(obj)

	_pools[pool_key] = pool_data
	print_rich("[color=green][ObjectPoolManager][/color] Pool initialisé avec succès : [b]" + pool_key + "[/b] (" + str(initial_size) + " objets pré-alloués)")

## Récupère un objet libre depuis le pool (0 allocation si disponible)
func spawn(pool_key: String, global_pos: Vector2, parent_node: Node = null) -> Node:
	if not _pools.has(pool_key):
		printerr("[ObjectPoolManager] Erreur : Pool inexistant : ", pool_key)
		return null

	var pool = _pools[pool_key]
	var obj: Node = null

	if pool["available"].size() > 0:
		obj = pool["available"].pop_back()
	else:
		# Extension contrôlée du pool avec limite Android
		if pool["active"].size() < max_pool_expansion:
			obj = pool["scene"].instantiate()
			add_child(obj)
			print("[ObjectPoolManager] Extension dynamique du pool '", pool_key, "' (Total: ", pool["active"].size() + 1, ")")
		else:
			# Réutilisation du plus ancien objet actif si capacité maximale atteinte (Cap de mémoire)
			obj = pool["active"].pop_front()

	if not obj:
		return null

	pool["active"].append(obj)
	
	if obj is Node2D:
		obj.global_position = global_pos

	obj.show()
	if obj.has_method("on_spawn_from_pool"):
		obj.call("on_spawn_from_pool")

	return obj

## Recycle un objet actif et le remet en réserve pour réutilisation future
func recycle(pool_key: String, obj: Node) -> void:
	if not _pools.has(pool_key) or not is_instance_valid(obj):
		return

	var pool = _pools[pool_key]
	if pool["active"].has(obj):
		pool["active"].erase(obj)
		obj.hide()
		if obj.has_method("on_recycled_to_pool"):
			obj.call("on_recycled_to_pool")
		pool["available"].append(obj)

## Vide et détruit tous les éléments d'un pool spécifique
func clear_pool(pool_key: String) -> void:
	if not _pools.has(pool_key):
		return

	var pool = _pools[pool_key]
	for obj in pool["available"]:
		if is_instance_valid(obj):
			obj.queue_free()
	for obj in pool["active"]:
		if is_instance_valid(obj):
			obj.queue_free()

	_pools.erase(pool_key)
	print("[ObjectPoolManager] Pool libéré : ", pool_key)

## Statistiques globales pour l'overlay de débogage
func get_pool_stats(pool_key: String) -> Dictionary:
	if not _pools.has(pool_key):
		return {"active": 0, "available": 0, "total": 0}
	
	var pool = _pools[pool_key]
	return {
		"active": pool["active"].size(),
		"available": pool["available"].size(),
		"total": pool["active"].size() + pool["available"].size()
	}`
  },
  {
    path: 'managers/MapStreamManager.gd',
    name: 'MapStreamManager.gd',
    category: 'managers',
    description: 'Préparation au Streaming de Carte dynamique et découpage en grilles/chunks',
    content: `# ============================================================================
# Description : Streaming de Carte Dynamique et découpage en Chunks 2D (Mobile & 60 FPS Target)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name MapStreamManager
extends Node

signal chunk_loaded(chunk_pos: Vector2i)
signal chunk_unloaded(chunk_pos: Vector2i)
signal player_chunk_changed(old_chunk: Vector2i, new_chunk: Vector2i)

## Taille d'un chunk de carte en pixels (ex: 500x500 unités)
@export var chunk_size: Vector2 = Vector2(500, 500)

## Rayon de chunks chargés autour de la caméra du joueur (ex: 2 = grille 5x5 active)
@export var render_distance_chunks: int = 2

## Dictionnaire des chunks actuellement chargés {Vector2i: ChunkNode}
var loaded_chunks: Dictionary = {}

## Position du chunk actuel du joueur
var player_current_chunk: Vector2i = Vector2i(-999, -999)

## File d'attente asynchrone pour le chargement progressif à bas coût processeur
var _load_queue: Array[Vector2i] = []

func _process(_delta: float) -> void:
	# Traiter un chunk par frame dans la file d'attente pour lisser le framerate (0 stuttering sur mobile)
	if _load_queue.size() > 0:
		var chunk_to_load = _load_queue.pop_front()
		_instantiate_chunk(chunk_to_load)

## Met à jour le positionnement du joueur et déclenche le streaming des chunks voisins
func update_player_position(player_global_pos: Vector2) -> void:
	var new_chunk = Vector2i(
		int(floor(player_global_pos.x / chunk_size.x)),
		int(floor(player_global_pos.y / chunk_size.y))
	)

	if new_chunk != player_current_chunk:
		var old_chunk = player_current_chunk
		player_current_chunk = new_chunk
		emit_signal("player_chunk_changed", old_chunk, new_chunk)
		_refresh_chunks()

## Analyse les chunks requis et décharge les chunks distants
func _refresh_chunks() -> void:
	var required_chunks: Array[Vector2i] = []

	for x in range(player_current_chunk.x - render_distance_chunks, player_current_chunk.x + render_distance_chunks + 1):
		for y in range(player_current_chunk.y - render_distance_chunks, player_current_chunk.y + render_distance_chunks + 1):
			required_chunks.append(Vector2i(x, y))

	# 1. Identifier et décharger les chunks hors du périmètre de rendu
	var chunks_to_unload: Array[Vector2i] = []
	for chunk_pos in loaded_chunks.keys():
		if not required_chunks.has(chunk_pos):
			chunks_to_unload.append(chunk_pos)

	for chunk_pos in chunks_to_unload:
		_unload_chunk(chunk_pos)

	# 2. Mettre en file d'attente les nouveaux chunks requis
	for chunk_pos in required_chunks:
		if not loaded_chunks.has(chunk_pos) and not _load_queue.has(chunk_pos):
			_load_queue.append(chunk_pos)

## Instancie physiquement un chunk de terrain
func _instantiate_chunk(chunk_pos: Vector2i) -> void:
	if loaded_chunks.has(chunk_pos):
		return

	# Création d'un conteneur de chunk virtuel
	var chunk_node = Node2D.new()
	chunk_node.name = "Chunk_" + str(chunk_pos.x) + "_" + str(chunk_pos.y)
	chunk_node.position = Vector2(chunk_pos.x * chunk_size.x, chunk_pos.y * chunk_size.y)
	add_child(chunk_node)

	loaded_chunks[chunk_pos] = chunk_node
	emit_signal("chunk_loaded", chunk_pos)

## Libère la mémoire d'un chunk distant
func _unload_chunk(chunk_pos: Vector2i) -> void:
	if not loaded_chunks.has(chunk_pos):
		return

	var chunk_node: Node2D = loaded_chunks[chunk_pos]
	if is_instance_valid(chunk_node):
		chunk_node.queue_free()

	loaded_chunks.erase(chunk_pos)
	emit_signal("chunk_unloaded", chunk_pos)

## Statistiques de streaming pour le panneau de débogage F3
func get_streaming_stats() -> Dictionary:
	return {
		"current_chunk": player_current_chunk,
		"active_chunks_count": loaded_chunks.size(),
		"queued_chunks_count": _load_queue.size(),
		"chunk_size_px": chunk_size
	}`
  },
  {
    path: 'animation/AnimationController.gd',
    name: 'AnimationController.gd',
    category: 'animation',
    description: 'Contrôleur d\'Animation State Machine, BlendSpace2D, locomotion et inclinaison procédurale',
    content: `# ============================================================================
# Description : Contrôleur d'Animation Global (StateMachine, BlendSpace, IK procédural)
# Auteur      : AnimationMaestro (Senior Technical Animator)
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name AnimationController
extends Node

## Signaux d'événements d'animation
signal footstep_triggered(foot_name: String, surface_type: String)
signal reload_animation_finished()
signal weapon_fired_anim()

## Énumérations des états d'animation
enum LocomotionState {
	IDLE,
	WALK,
	SPRINT,
	CROUCH_IDLE,
	CROUCH_WALK,
	FALLING,
	LANDING
}

enum UpperBodyState {
	NEUTRAL,
	AIMING,
	FIRING,
	RELOADING,
	HEALING,
	MELEE_STRIKE
}

## Références aux nœuds
@export var parent_entity: CharacterBody2D
@export var animation_tree: AnimationTree
@export var sprite_root: Node2D

## Paramètres de blending & dynamiques
@export_group("Blending Speeds")
@export var locomotion_blend_speed: float = 8.0
@export var aim_blend_speed: float = 14.0
@export var lean_tilt_factor: float = 0.08

## Paramètres de mouvement secondaire & Head Bob
@export_group("Secondary Motion")
@export var enable_breathing: bool = true
@export var breathing_speed: float = 2.2
@export var breathing_amplitude: float = 0.03
@export var bobbing_amplitude: float = 2.5

## États courants
var current_loco_state: LocomotionState = LocomotionState.IDLE
var current_upper_state: UpperBodyState = UpperBodyState.NEUTRAL

## Variables internes d'interpolation
var _blend_position: Vector2 = Vector2.ZERO
var _current_aim_angle: float = 0.0
var _bobbing_time: float = 0.0
var _base_scale: Vector2 = Vector2.ONE
var _hit_shake_offset: Vector2 = Vector2.ZERO
var _hit_shake_energy: float = 0.0

## LOD & optimisation
var _update_timer: float = 0.0
var _lod_interval: float = 0.0

func _ready() -> void:
	if sprite_root:
		_base_scale = sprite_root.scale
	if animation_tree:
		animation_tree.active = true
	print_rich("[color=magenta][AnimationMaestro][/color] AnimationController initialisé avec succès.")

func _process(delta: float) -> void:
	if _hit_shake_energy > 0.001:
		_hit_shake_energy = move_toward(_hit_shake_energy, 0.0, delta * 12.0)
		_hit_shake_offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * _hit_shake_energy
	else:
		_hit_shake_offset = Vector2.ZERO

	_update_procedural_motion(delta)

func update_animation_state(velocity: Vector2, facing_direction: Vector2, is_sprinting: bool, is_aiming: bool, delta: float) -> void:
	var speed: float = velocity.length()
	
	if speed < 5.0:
		current_loco_state = LocomotionState.IDLE
	elif is_sprinting:
		current_loco_state = LocomotionState.SPRINT
	else:
		current_loco_state = LocomotionState.WALK
		
	var forward_proj: float = 0.0
	var lateral_proj: float = 0.0
	
	if speed > 1.0 and facing_direction.length_squared() > 0.01:
		var norm_facing = facing_direction.normalized()
		var right_vec = Vector2(-norm_facing.y, norm_facing.x)
		var norm_vel = velocity.normalized()
		forward_proj = norm_vel.dot(norm_facing)
		lateral_proj = norm_vel.dot(right_vec)
	
	var target_blend = Vector2(lateral_proj, forward_proj) * (1.0 if not is_sprinting else 1.5)
	_blend_position = _blend_position.lerp(target_blend, locomotion_blend_speed * delta)
	
	if animation_tree:
		animation_tree.set("parameters/locomotion/blend_position", _blend_position)
		animation_tree.set("parameters/conditions/is_idle", speed < 5.0)
		animation_tree.set("parameters/conditions/is_moving", speed >= 5.0)
		animation_tree.set("parameters/conditions/is_sprinting", is_sprinting)

func _update_procedural_motion(delta: float) -> void:
	if not sprite_root:
		return
		
	_bobbing_time += delta
	var breath_scale = 1.0
	if enable_breathing and current_loco_state == LocomotionState.IDLE:
		breath_scale = 1.0 + sin(_bobbing_time * breathing_speed) * breathing_amplitude
	
	var tilt_angle = _blend_position.x * lean_tilt_factor
	sprite_root.scale = Vector2(_base_scale.x * breath_scale, _base_scale.y * (2.0 - breath_scale))
	sprite_root.rotation = tilt_angle
	sprite_root.position = _hit_shake_offset

func play_shoot_kick(strength: float = 4.0) -> void:
	_hit_shake_energy = max(_hit_shake_energy, strength)
	emit_signal("weapon_fired_anim")

func play_damage_flinch(intensity: float = 6.0) -> void:
	_hit_shake_energy = intensity

func on_animation_step_marker(foot: String, surface: String = "dirt") -> void:
	emit_signal("footstep_triggered", foot, surface)`
  },
  {
    path: 'animation/ProceduralWeaponAnim.gd',
    name: 'ProceduralWeaponAnim.gd',
    category: 'animation',
    description: 'Physique de recul par ressort amorti, Weapon Sway et balancement procédural',
    content: `# ============================================================================
# Description : Système d'Animation Procédurale des Armes (Recul à ressort, Sway, ADS, Bobbing)
# Auteur      : AnimationMaestro (Senior Technical Animator)
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name ProceduralWeaponAnim
extends Node2D

## Paramètres de recul (Spring-damper physics)
@export_group("Recoil Physics")
@export var recoil_distance: float = 12.0
@export var recoil_rotation_deg: float = 8.0
@export var spring_stiffness: float = 240.0
@export var spring_damping: float = 18.0

## Paramètres de sway (Inertie angulaire)
@export_group("Weapon Sway")
@export var sway_amount: float = 0.05
@export var max_sway_deg: float = 15.0
@export var sway_smoothness: float = 10.0

## Paramètres de balancement de marche (Bobbing)
@export_group("Bobbing")
@export var walk_bob_speed: float = 10.0
@export var walk_bob_amount: Vector2 = Vector2(1.5, 3.0)
@export var sprint_bob_multiplier: float = 1.6

## Variables physiques internes (système de ressort amorti)
var _recoil_pos: Vector2 = Vector2.ZERO
var _recoil_pos_velocity: Vector2 = Vector2.ZERO
var _recoil_rot: float = 0.0
var _recoil_rot_velocity: float = 0.0

var _current_sway_rot: float = 0.0
var _previous_parent_rotation: float = 0.0
var _bob_timer: float = 0.0
var _rest_position: Vector2 = Vector2.ZERO

func _ready() -> void:
	_rest_position = position
	if get_parent() is Node2D:
		_previous_parent_rotation = (get_parent() as Node2D).global_rotation

func _process(delta: float) -> void:
	_update_sway(delta)
	_update_recoil_spring(delta)
	_apply_transform()

func _update_sway(delta: float) -> void:
	if not (get_parent() is Node2D):
		return
		
	var current_parent_rot = (get_parent() as Node2D).global_rotation
	var rot_delta = angle_difference(current_parent_rot, _previous_parent_rotation)
	_previous_parent_rotation = current_parent_rot
	
	var target_sway = clampf(-rot_delta * sway_amount * 100.0, -deg_to_rad(max_sway_deg), deg_to_rad(max_sway_deg))
	_current_sway_rot = lerpf(_current_sway_rot, target_sway, sway_smoothness * delta)

func _update_recoil_spring(delta: float) -> void:
	var pos_force = -spring_stiffness * _recoil_pos - spring_damping * _recoil_pos_velocity
	_recoil_pos_velocity += pos_force * delta
	_recoil_pos += _recoil_pos_velocity * delta

	var rot_force = -spring_stiffness * _recoil_rot - spring_damping * _recoil_rot_velocity
	_recoil_rot_velocity += rot_force * delta
	_recoil_rot += _recoil_rot_velocity * delta

func update_movement_bob(velocity: Vector2, is_sprinting: bool, delta: float) -> void:
	var speed = velocity.length()
	if speed > 10.0:
		var mult = sprint_bob_multiplier if is_sprinting else 1.0
		_bob_timer += delta * walk_bob_speed * mult
	else:
		_bob_timer = move_toward(_bob_timer, 0.0, delta * 4.0)

func apply_fire_impulse(intensity: float = 1.0, is_ads: bool = false) -> void:
	var factor = 0.4 if is_ads else 1.0
	_recoil_pos_velocity += Vector2(-recoil_distance * intensity * factor, randf_range(-1.5, 1.5)) * 20.0
	var rot_kick = randf_range(-recoil_rotation_deg, recoil_rotation_deg * 0.5) * deg_to_rad(intensity * factor)
	_recoil_rot_velocity += rot_kick * 25.0

func _apply_transform() -> void:
	var bob_offset = Vector2(
		cos(_bob_timer * 0.5) * walk_bob_amount.x,
		abs(sin(_bob_timer)) * -walk_bob_amount.y
	)
	position = _rest_position + _recoil_pos + bob_offset
	rotation = _recoil_rot + _current_sway_rot`
  }
];
