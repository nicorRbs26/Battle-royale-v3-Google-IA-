# ============================================================================
# Description : Interface du Menu des Paramètres (Résolution, Plein écran, Volumes, Qualité Graphique)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SettingsMenu
extends Control

@onready var fullscreen_checkbox: CheckBox = $VBoxContainer/FullscreenCheckBox if has_node("VBoxContainer/FullscreenCheckBox") else null
@onready var master_slider: HSlider = $VBoxContainer/MasterSlider if has_node("VBoxContainer/MasterSlider") else null
@onready var music_slider: HSlider = $VBoxContainer/MusicSlider if has_node("VBoxContainer/MusicSlider") else null
@onready var sfx_slider: HSlider = $VBoxContainer/SFXSlider if has_node("VBoxContainer/SFXSlider") else null
@onready var apply_button: Button = $VBoxContainer/ApplyButton if has_node("VBoxContainer/ApplyButton") else null

func _ready() -> void:
	_load_ui_from_settings()

func _load_ui_from_settings() -> void:
	if fullscreen_checkbox:
		fullscreen_checkbox.button_pressed = SettingsManager.settings_data["fullscreen"]
	if master_slider:
		master_slider.value = SettingsManager.settings_data["master_volume"]
	if music_slider:
		music_slider.value = SettingsManager.settings_data["music_volume"]
	if sfx_slider:
		sfx_slider.value = SettingsManager.settings_data["sfx_volume"]

func _on_apply_pressed() -> void:
	if fullscreen_checkbox:
		SettingsManager.settings_data["fullscreen"] = fullscreen_checkbox.button_pressed
	if master_slider:
		SettingsManager.settings_data["master_volume"] = master_slider.value
	if music_slider:
		SettingsManager.settings_data["music_volume"] = music_slider.value
	if sfx_slider:
		SettingsManager.settings_data["sfx_volume"] = sfx_slider.value
		
	SettingsManager.apply_all_settings()
	SettingsManager.save_settings()
	hide()
