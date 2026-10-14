# ============================================================================
# Description : Interface du Menu Principal (Logo, Jouer, Paramètres, Quitter)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name MainMenu
extends Control

@onready var play_button: Button = $MarginContainer/VBoxContainer/PlayButton if has_node("MarginContainer/VBoxContainer/PlayButton") else null
@onready var settings_button: Button = $MarginContainer/VBoxContainer/SettingsButton if has_node("MarginContainer/VBoxContainer/SettingsButton") else null
@onready var quit_button: Button = $MarginContainer/VBoxContainer/QuitButton if has_node("MarginContainer/VBoxContainer/QuitButton") else null
@onready var settings_panel: Control = $SettingsPanel if has_node("SettingsPanel") else null

func _ready() -> void:
	if play_button: play_button.pressed.connect(_on_play_pressed)
	if settings_button: settings_button.pressed.connect(_on_settings_pressed)
	if quit_button: quit_button.pressed.connect(_on_quit_pressed)

func _on_play_pressed() -> void:
	print("[MainMenu] Lancement du match Battle Royale...")
	SceneManager.change_scene_to_file_async("res://world/TestMap.tscn")

func _on_settings_pressed() -> void:
	if settings_panel:
		settings_panel.show()

func _on_quit_pressed() -> void:
	get_tree().quit()
