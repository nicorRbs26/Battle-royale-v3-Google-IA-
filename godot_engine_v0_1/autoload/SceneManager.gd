# ============================================================================
# Description : Transition de scènes asynchrone multithreadée avec libération mémoire
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+ Android Fast Loading)
# ============================================================================
class_name SceneManager
extends Node

signal scene_change_started(scene_path: String)
signal scene_change_progress(progress: float)
signal scene_change_completed(scene_path: String)

var _current_scene: Node = null
var _scene_cache: Dictionary = {}

func _ready() -> void:
	var root = get_tree().root
	_current_scene = root.get_child(root.get_child_count() - 1)

## Change de scène de manière asynchrone multithreadée (Ecran de chargement fluide)
func change_scene_to_file_async(target_scene_path: String, use_cache: bool = true) -> void:
	if not ResourceLoader.exists(target_scene_path):
		printerr("[SceneManager] Erreur : La scène ", target_scene_path, " n'existe pas.")
		return

	emit_signal("scene_change_started", target_scene_path)
	GameManager.change_state(GameManager.GameState.LOADING)
	
	# Vérifier si la scène est déjà préchargée dans le cache
	if use_cache and _scene_cache.has(target_scene_path):
		var packed_scene: PackedScene = _scene_cache[target_scene_path]
		_switch_to_packed_scene(packed_scene, target_scene_path)
		return

	# Lancement du chargement multithreadé natif Godot 4.5
	ResourceLoader.load_threaded_request(target_scene_path, "", true)
	var progress: Array = []
	var status = ResourceLoader.THREAD_LOAD_IN_PROGRESS
	
	while status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
		status = ResourceLoader.load_threaded_get_status(target_scene_path, progress)
		var current_progress: float = progress[0] if progress.size() > 0 else 0.0
		emit_signal("scene_change_progress", current_progress)
		await get_tree().process_frame
		
	if status == ResourceLoader.THREAD_LOAD_LOADED:
		var packed_scene: PackedScene = ResourceLoader.load_threaded_get(target_scene_path)
		if use_cache:
			_scene_cache[target_scene_path] = packed_scene
		_switch_to_packed_scene(packed_scene, target_scene_path)
	else:
		printerr("[SceneManager] Erreur lors du chargement de la scène : ", target_scene_path)

## Effectue le remplacement de scène avec libération de la mémoire résiduelle
func _switch_to_packed_scene(packed_scene: PackedScene, scene_path: String) -> void:
	if _current_scene:
		_current_scene.queue_free()
		# Nettoyage explicite des orphelins mémoire sur Android
		await get_tree().process_frame
		
	_current_scene = packed_scene.instantiate()
	get_tree().root.add_child(_current_scene)
	get_tree().current_scene = _current_scene
	
	emit_signal("scene_change_completed", scene_path)
	if scene_path.contains("MainMenu"):
		GameManager.change_state(GameManager.GameState.MAIN_MENU)
	else:
		GameManager.change_state(GameManager.GameState.PLAYING)
