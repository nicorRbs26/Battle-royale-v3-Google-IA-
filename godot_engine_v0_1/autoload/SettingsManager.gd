# ============================================================================
# Description : Gestionnaire de paramètres graphiques, audio et préférences
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SettingsManager
extends Node

const SETTINGS_PATH: String = "user://settings.json"

enum QualityPreset { LOW, MEDIUM, HIGH, ULTRA }

var settings_data: Dictionary = {
	"resolution_w": 1280,
	"resolution_h": 720,
	"fullscreen": false,
	"master_volume": 1.0,
	"music_volume": 0.8,
	"sfx_volume": 0.9,
	"graphics_quality": QualityPreset.MEDIUM,
	"vsync_enabled": true
}

func _ready() -> void:
	load_settings()
	apply_all_settings()

## Applique l'ensemble des paramètres configurés
func apply_all_settings() -> void:
	# 1. Résolution et mode écran
	var mode = DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN if settings_data["fullscreen"] else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(mode)
	if not settings_data["fullscreen"]:
		DisplayServer.window_set_size(Vector2i(settings_data["resolution_w"], settings_data["resolution_h"]))
		
	# 2. VSync
	var vsync_mode = DisplayServer.VSYNC_ENABLED if settings_data["vsync_enabled"] else DisplayServer.VSYNC_DISABLED
	DisplayServer.window_set_vsync_mode(vsync_mode)

	# 3. Volumes Audio
	AudioManager.set_bus_volume(AudioManager.AudioBus.MASTER, settings_data["master_volume"])
	AudioManager.set_bus_volume(AudioManager.AudioBus.MUSIC, settings_data["music_volume"])
	AudioManager.set_bus_volume(AudioManager.AudioBus.SFX, settings_data["sfx_volume"])

## Sauvegarde des paramètres dans le stockage utilisateur
func save_settings() -> void:
	var file = FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(settings_data, "\t"))
		file.close()
		print("[SettingsManager] Paramètres sauvegardés.")

## Chargement des paramètres
func load_settings() -> void:
	if FileAccess.file_exists(SETTINGS_PATH):
		var file = FileAccess.open(SETTINGS_PATH, FileAccess.READ)
		if file:
			var json = JSON.new()
			if json.parse(file.get_as_text()) == OK:
				var loaded = json.get_data()
				for key in loaded:
					settings_data[key] = loaded[key]
			file.close()
