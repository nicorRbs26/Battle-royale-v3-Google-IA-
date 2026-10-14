# ============================================================================
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
var _lod_interval: float = 0.0 # 0 = chaque frame (60/120fps)

func _ready() -> void:
	if sprite_root:
		_base_scale = sprite_root.scale
	
	# Initialisation de l'AnimationTree si disponible
	if animation_tree:
		animation_tree.active = true
	print_rich("[color=magenta][AnimationMaestro][/color] AnimationController initialisé avec succès.")

func _process(delta: float) -> void:
	# Traitement du tremblement / hit reaction
	if _hit_shake_energy > 0.001:
		_hit_shake_energy = move_toward(_hit_shake_energy, 0.0, delta * 12.0)
		_hit_shake_offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * _hit_shake_energy
	else:
		_hit_shake_offset = Vector2.ZERO

	_update_procedural_motion(delta)

## Met à jour les calculs d'animation en fonction du CharacterBody2D
func update_animation_state(velocity: Vector2, facing_direction: Vector2, is_sprinting: bool, is_aiming: bool, delta: float) -> void:
	var speed: float = velocity.length()
	
	# 1. Détermination de l'état de locomotion
	if speed < 5.0:
		current_loco_state = LocomotionState.IDLE
	elif is_sprinting:
		current_loco_state = LocomotionState.SPRINT
	else:
		current_loco_state = LocomotionState.WALK
		
	# 2. Calcul du BlendSpace relatif (Forward / Lateral Strafe)
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
	
	# 3. Injection dans l'AnimationTree (si instancié)
	if animation_tree:
		animation_tree.set("parameters/locomotion/blend_position", _blend_position)
		animation_tree.set("parameters/conditions/is_idle", speed < 5.0)
		animation_tree.set("parameters/conditions/is_moving", speed >= 5.0)
		animation_tree.set("parameters/conditions/is_sprinting", is_sprinting)

## Animation procédurale de respiration, pas et inclinaison (Lean & Bobbing)
func _update_procedural_motion(delta: float) -> void:
	if not sprite_root:
		return
		
	_bobbing_time += delta
	
	# Respiration (Idle Breathing)
	var breath_scale = 1.0
	if enable_breathing and current_loco_state == LocomotionState.IDLE:
		breath_scale = 1.0 + sin(_bobbing_time * breathing_speed) * breathing_amplitude
	
	# Inclinaison procédurale dans les virages (Lean / Tilt)
	var tilt_angle = _blend_position.x * lean_tilt_factor
	
	# Application au transform racine du sprite
	sprite_root.scale = Vector2(_base_scale.x * breath_scale, _base_scale.y * (2.0 - breath_scale))
	sprite_root.rotation = tilt_angle
	sprite_root.position = _hit_shake_offset

## Déclenche un recul ou une secousse de tir
func play_shoot_kick(strength: float = 4.0) -> void:
	_hit_shake_energy = max(_hit_shake_energy, strength)
	emit_signal("weapon_fired_anim")

## Déclenche une réaction d'impact (Damage Flinch)
func play_damage_flinch(intensity: float = 6.0) -> void:
	_hit_shake_energy = intensity

## Événement de pas (appelé par les Animation Notifiers / AnimationPlayer Call Methods)
func on_animation_step_marker(foot: String, surface: String = "dirt") -> void:
	emit_signal("footstep_triggered", foot, surface)
