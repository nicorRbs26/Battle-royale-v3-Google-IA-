# ============================================================================
# Description : Caméra de suivi fluide avec ammortissement (lerp), zoom dynamique et secousses
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
var _shake_decay: float = 5.0

func _ready() -> void:
	if not target_node_path.is_empty():
		target_node = get_node_or_null(target_node_path) as Node2D

func _process(delta: float) -> void:
	if target_node and is_instance_valid(target_node):
		# Suivi lissé vers le joueur
		global_position = global_position.lerp(target_node.global_position, follow_speed * delta)
		
	# Zoom progressif
	zoom = zoom.lerp(target_zoom, zoom_speed * delta)
	
	# Gestion de la secousse de caméra (Screen Shake)
	if _shake_intensity > 0.01:
		offset = Vector2(
			randf_range(-_shake_intensity, _shake_intensity),
			randf_range(-_shake_intensity, _shake_intensity)
		)
		_shake_intensity = lerp(_shake_intensity, 0.0, _shake_decay * delta)
	else:
		offset = Vector2.ZERO

func _unhandled_input(event: InputEvent) -> void:
	# Zoom / Dézoom avec la molette de la souris
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			target_zoom = (target_zoom * 1.1).clamp(Vector2(min_zoom, min_zoom), Vector2(max_zoom, max_zoom))
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			target_zoom = (target_zoom * 0.9).clamp(Vector2(min_zoom, min_zoom), Vector2(max_zoom, max_zoom))

## Déclenche une secousse de la caméra
func add_shake(intensity: float) -> void:
	_shake_intensity = max(_shake_intensity, intensity)
