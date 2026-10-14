# ============================================================================
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
	}
