# ============================================================================
# Description : Contrôleur du Joueur (Mouvement fluide, collisions, sprint, stamina et orientation)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name Player
extends CharacterBody2D

## Paramètres de mouvement
@export var walk_speed: float = 240.0
@export var sprint_speed: float = 380.0
@export var acceleration: float = 2400.0
@export var friction: float = 1800.0
@export var max_stamina: float = 100.0

## Santé et armure
@export var max_health: float = 100.0
@export var max_shield: float = 100.0

var current_health: float = 100.0
var current_shield: float = 50.0
var current_stamina: float = 100.0
var is_sprinting: bool = false
var is_stamina_exhausted: bool = false

## Composants
@onready var sprite: Sprite2D = $Sprite2D if has_node("Sprite2D") else null
@onready var collision: CollisionShape2D = $CollisionShape2D if has_node("CollisionShape2D") else null

signal stats_changed(health: float, shield: float, stamina: float)

func _ready() -> void:
	current_health = max_health
	current_shield = 50.0
	current_stamina = max_stamina
	print_rich("[color=green][Player][/color] Joueur instancié aux coordonnées : ", global_position)

func _physics_process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return

	_handle_movement(delta)
	_handle_rotation()
	_update_stamina(delta)
	
	move_and_slide()

func _handle_movement(delta: float) -> void:
	var move_vector = InputManager.get_movement_vector()
	
	# Gestion de l'épuisement (ne peut plus sprinter si < 5, doit remonter à 20 pour reprendre)
	if current_stamina < 5.0:
		is_stamina_exhausted = true
	elif current_stamina > 20.0:
		is_stamina_exhausted = false

	var wants_sprint = Input.is_action_pressed("sprint") and not is_stamina_exhausted and move_vector.length_squared() > 0.1
	is_sprinting = wants_sprint

	var target_speed = sprint_speed if is_sprinting else walk_speed
	var target_velocity = move_vector * target_speed

	if move_vector.length_squared() > 0.0:
		velocity = velocity.move_toward(target_velocity, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

func _handle_rotation() -> void:
	# Orientation vers la souris sur PC / vers le joystick d'incubation sur mobile
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
		
	emit_signal("stats_changed", current_health, current_shield, current_stamina)

## Infliger des dégâts au joueur
func take_damage(amount: float) -> void:
	if current_shield > 0:
		var shield_dmg = min(current_shield, amount)
		current_shield -= shield_dmg
		amount -= shield_dmg
		
	if amount > 0:
		current_health = max(0.0, current_health - amount)

	emit_signal("stats_changed", current_health, current_shield, current_stamina)

	if current_health <= 0:
		_die()

func _die() -> void:
	print_rich("[color=red][Player][/color] Le joueur a été éliminé.")
	GameManager.change_state(GameManager.GameState.GAME_OVER)
