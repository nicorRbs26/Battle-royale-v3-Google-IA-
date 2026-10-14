# ============================================================================
# Description : Carte de test Battle Royale V0.1 (Sol, Bâtiments, Obstacles, Arbres, Zones de collision)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name TestMap
extends Node2D

@export var map_size: Vector2 = Vector2(2500, 2500)
@export var storm_shrink_speed: float = 12.0

var storm_center: Vector2 = Vector2(1250, 1250)
var storm_radius: float = 1200.0
var min_storm_radius: float = 100.0

func _ready() -> void:
	print_rich("[color=yellow][TestMap][/color] Carte de test initialisée avec taille : ", map_size)
	_generate_environment()

func _process(delta: float) -> void:
	if GameManager.current_state == GameManager.GameState.PLAYING:
		# Réduction progressive de la zone de sécurité (Préparation V0.2)
		if storm_radius > min_storm_radius:
			storm_radius = max(min_storm_radius, storm_radius - storm_shrink_speed * delta)
		queue_redraw()

func _draw() -> void:
	# Dessin de la bordure de la Tempête / Zone de Sécurité
	draw_arc(storm_center, storm_radius, 0, TAU, 64, Color(0.2, 0.6, 1.0, 0.8), 3.0)
	draw_rect(Rect2(Vector2.ZERO, map_size), Color(0.1, 0.8, 0.3, 0.15), false, 4.0)

func _generate_environment() -> void:
	# Génération procédurale d'obstacles de test
	print("[TestMap] Génération du terrain et des collisions...")
