extends CharacterBody2D

@export_group("Movement")
@export var speed := 250.0
@export var acceleration := 1200.0
@export var friction := 1500.0

@export_group("Jump")
@export var jump_velocity := -450.0
@export var gravity_scale := 1.2

@export_group("Abilities")
@export var dash_speed := 600.0
@export var dash_duration := 0.15

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")
var is_dashing := false
var dash_timer := 0.0

func _physics_process(delta: float) -> void:
    # Appliquer la gravité
    if not is_on_floor() and not is_dashing:
        velocity.y += gravity * gravity_scale * delta

    # Gestion du saut
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Gestion du Dash
    if Input.is_action_just_pressed("dash") and not is_dashing:
        start_dash()

    if is_dashing:
        dash_timer -= delta
        if dash_timer <= 0:
            is_dashing = false
    else:
        # Mouvement horizontal standard
        var direction := Input.get_axis("move_left", "move_right")
        if direction:
            velocity.x = move_toward(velocity.x, direction * speed, acceleration * delta)
        else:
            velocity.x = move_toward(velocity.x, 0, friction * delta)

    move_and_slide()

func start_dash() -> void:
    is_dashing = true
    dash_timer = dash_duration
    var direction = Input.get_axis("move_left", "move_right")
    if direction == 0: direction = 1 if not $Sprite2D.flip_h else -1
    velocity.x = direction * dash_speed
    velocity.y = 0 # Dash horizontal pur
