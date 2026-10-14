# ============================================================================
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
	}
