extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, SEARCH }

@export_group("Vision")
@export var vision_range := 400.0
@export var vision_angle := 45.0 # En degrés (demi-angle du cône)
@export var detection_speed := 2.0 # Temps pour détecter totalement le joueur

@export_group("Movement")
@export var patrol_speed := 120.0
@export var chase_speed := 220.0
@export var patrol_points: Array[Vector2]
@export var search_duration := 3.0

var current_state := State.PATROL
var target_player: Node2D = null
var current_patrol_idx := 0
var detection_level := 0.0 # 0.0 à 1.0
var search_timer := 0.0

func _ready() -> void:
	# Recherche automatique du joueur dans le groupe "player"
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		target_player = players[0]

func _physics_process(delta: float) -> void:
	match current_state:
		State.PATROL:
			_handle_patrol(delta)
			_check_vision(delta)
		State.CHASE:
			_handle_chase(delta)
		State.SEARCH:
			_handle_search(delta)

func _check_vision(delta: float) -> void:
	if not target_player: return
	
	var to_player = target_player.global_position - global_position
	var dist = to_player.length()
	
	if dist < vision_range:
		var forward = Vector2.RIGHT.rotated(global_rotation)
		var angle_to_player = rad_to_deg(forward.angle_to(to_player))
		
		if abs(angle_to_player) < vision_angle:
			# Raycast pour occlusion
			var space_state = get_world_2d().direct_space_state
			var query = PhysicsRayQueryParameters2D.create(global_position, target_player.global_position)
			query.exclude = [self]
			var result = space_state.intersect_ray(query)
			
			if result and result.collider == target_player:
				detection_level += delta * detection_speed
				if detection_level >= 1.0:
					current_state = State.CHASE
					search_timer = search_duration
					_alert_nearby_enemies()
				return

	detection_level = max(0.0, detection_level - delta * 0.5)

func _handle_patrol(delta: float) -> void:
	if patrol_points.is_empty(): return
	
	var target = patrol_points[current_patrol_idx]
	var dir = global_position.direction_to(target)
	velocity = dir * patrol_speed
	
	# Rotation fluide vers la direction de marche
	global_rotation = lerp_angle(global_rotation, dir.angle(), 5.0 * delta)
	
	if global_position.distance_to(target) < 20.0:
		current_patrol_idx = (current_patrol_idx + 1) % patrol_points.size()
	
	move_and_slide()

func _handle_chase(delta: float) -> void:
	if not target_player:
		current_state = State.SEARCH
		return
		
	var dir = global_position.direction_to(target_player.global_position)
	velocity = dir * chase_speed
	global_rotation = lerp_angle(global_rotation, dir.angle(), 10.0 * delta)
	
	if global_position.distance_to(target_player.global_position) > vision_range * 1.5:
		current_state = State.SEARCH
		
	move_and_slide()

func _handle_search(delta: float) -> void:
	# L'ennemi tourne sur lui-même pour chercher
	global_rotation += 2.0 * delta
	velocity = Vector2.ZERO
	
	search_timer -= delta
	if search_timer <= 0:
		current_state = State.PATROL
		detection_level = 0.0

func _alert_nearby_enemies() -> void:
	# Logique pour alerter les autres gardes dans un rayon
	pass
