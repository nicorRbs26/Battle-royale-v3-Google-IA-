# ============================================================================
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
			stream_val.text = "Map Streaming : Chunk " + str(s_stats.get("current_chunk", Vector2i.ZERO)) + " (" + str(s_stats.get("active_chunks_count", 0)) + " Chunks chargés)"
