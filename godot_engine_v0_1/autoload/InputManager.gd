# ============================================================================
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
	# Enregistrement dynamique des actions s'il n'existe pas dans le project.godot
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

## Retourne le vecteur de déplacement normalisé (Clavier ou Joystick Tactile)
func get_movement_vector() -> Vector2:
	if is_touch_active and touch_vector != Vector2.ZERO:
		return touch_vector.normalized()
		
	var vector = Vector2.ZERO
	vector.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
	vector.y = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	
	return vector.normalized() if vector.length_squared() > 0.0 else Vector2.ZERO

## Définit la valeur du joystick tactile Android
func set_touch_vector(v: Vector2) -> void:
	touch_vector = v
	if not is_touch_active:
		is_touch_active = true
		emit_signal("input_device_changed", true)
