# ============================================================================
# Description : Gestionnaire de son (Bus Audio, Effets SFX, Musiques d'ambiance et Object Pooling Audio)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name AudioManager
extends Node

## Canaux audio
enum AudioBus { MASTER, MUSIC, SFX }

var _sfx_players: Array[AudioStreamPlayer] = []
var _pool_size: int = 16

func _ready() -> void:
	# Création d'un pool d'AudioStreamPlayer pour les effets sonores rapides
	for i in range(_pool_size):
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)

## Joue un effet sonore via pooling
func play_sfx(stream: AudioStream, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not stream:
		return
		
	for player in _sfx_players:
		if not player.playing:
			player.stream = stream
			player.pitch_scale = pitch_scale
			player.volume_db = volume_db
			player.play()
			return

## Ajuste le volume d'un bus (Master, Musique, Effets) de 0.0 à 1.0
func set_bus_volume(bus_type: AudioBus, linear_volume: float) -> void:
	var bus_name = "Master"
	match bus_type:
		AudioBus.MUSIC: bus_name = "Music"
		AudioBus.SFX: bus_name = "SFX"
		
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx != -1:
		var db = linear_to_db(clamp(linear_volume, 0.0001, 1.0))
		AudioServer.set_bus_volume_db(bus_idx, db)
		AudioServer.set_bus_mute(bus_idx, linear_volume <= 0.001)
