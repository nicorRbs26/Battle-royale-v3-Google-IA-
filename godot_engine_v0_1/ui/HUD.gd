# ============================================================================
# Description : Interface Heads-Up Display (FPS, Position X/Y, Version moteur, Ping)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name HUD
extends CanvasLayer

@onready var fps_label: Label = $TopRightContainer/FPSLabel if has_node("TopRightContainer/FPSLabel") else null
@onready var pos_label: Label = $TopRightContainer/PosLabel if has_node("TopRightContainer/PosLabel") else null
@onready var engine_version_label: Label = $BottomLeftContainer/VersionLabel if has_node("BottomLeftContainer/VersionLabel") else null
@onready var ping_label: Label = $TopRightContainer/PingLabel if has_node("TopRightContainer/PingLabel") else null

var player_ref: Node2D = null

func _ready() -> void:
	if engine_version_label:
		engine_version_label.text = GameManager.engine_version

func _process(_delta: float) -> void:
	# Mise à jour des FPS
	if fps_label:
		fps_label.text = "FPS: " + str(Engine.get_frames_per_second())
		
	# Mise à jour des coordonnées
	if pos_label and player_ref and is_instance_valid(player_ref):
		var p = player_ref.global_position
		pos_label.text = "X: " + str(snapped(p.x, 0.1)) + " Y: " + str(snapped(p.y, 0.1))
		
	# Preview du Ping
	if ping_label:
		ping_label.text = "Ping: 14 ms"
