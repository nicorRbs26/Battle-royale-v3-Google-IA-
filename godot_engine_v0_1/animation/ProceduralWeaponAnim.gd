# ============================================================================
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

## Met à jour le balancement d'inertie de l'arme
func _update_sway(delta: float) -> void:
	if not (get_parent() is Node2D):
		return
		
	var current_parent_rot = (get_parent() as Node2D).global_rotation
	var rot_delta = angle_difference(current_parent_rot, _previous_parent_rotation)
	_previous_parent_rotation = current_parent_rot
	
	var target_sway = clampf(-rot_delta * sway_amount * 100.0, -deg_to_rad(max_sway_deg), deg_to_rad(max_sway_deg))
	_current_sway_rot = lerpf(_current_sway_rot, target_sway, sway_smoothness * delta)

## Simulation physique d'amortissement de recul (Harmonic Spring Damper)
func _update_recoil_spring(delta: float) -> void:
	# Force de rappel proportionnelle au déplacement + frottement proportionnel à la vitesse
	var pos_force = -spring_stiffness * _recoil_pos - spring_damping * _recoil_pos_velocity
	_recoil_pos_velocity += pos_force * delta
	_recoil_pos += _recoil_pos_velocity * delta

	var rot_force = -spring_stiffness * _recoil_rot - spring_damping * _recoil_rot_velocity
	_recoil_rot_velocity += rot_force * delta
	_recoil_rot += _recoil_rot_velocity * delta

## Calcule et applique le bobbing de déplacement
func update_movement_bob(velocity: Vector2, is_sprinting: bool, delta: float) -> void:
	var speed = velocity.length()
	if speed > 10.0:
		var mult = sprint_bob_multiplier if is_sprinting else 1.0
		_bob_timer += delta * walk_bob_speed * mult
	else:
		_bob_timer = move_toward(_bob_timer, 0.0, delta * 4.0)

## Déclenche une impulsion de recul lors du tir
func apply_fire_impulse(intensity: float = 1.0, is_ads: bool = false) -> void:
	var factor = 0.4 if is_ads else 1.0
	# Recul vers l'arrière local
	_recoil_pos_velocity += Vector2(-recoil_distance * intensity * factor, randf_range(-1.5, 1.5)) * 20.0
	# Relevé du canon aléatoire
	var rot_kick = randf_range(-recoil_rotation_deg, recoil_rotation_deg * 0.5) * deg_to_rad(intensity * factor)
	_recoil_rot_velocity += rot_kick * 25.0

func _apply_transform() -> void:
	# Calcul du décalage de bobbing
	var bob_offset = Vector2(
		cos(_bob_timer * 0.5) * walk_bob_amount.x,
		abs(sin(_bob_timer)) * -walk_bob_amount.y
	)
	
	position = _rest_position + _recoil_pos + bob_offset
	rotation = _recoil_rot + _current_sway_rot
