# ============================================================================
# Description : Gestionnaire de sauvegarde et persistance des données utilisateur (Fichier JSON)
# Auteur      : Senior Game Engine Developer
# Version     : 0.1.0 (Godot 4.5+)
# ============================================================================
class_name SaveManager
extends Node

const SAVE_PATH: String = "user://save_data.bin"
const ENCRYPTION_KEY: String = "BR_SECURE_KEY_2024" # À déplacer dans une variable d'environnement ou config secrète

var default_data: Dictionary = {
	"player_name": "Survivant",
	"games_played": 0,
	"wins": 0,
	"kills": 0,
	"high_score": 0,
	"selected_skin": "default"
}

## Sauvegarde les données sur disque avec chiffrement
func save_game(data: Dictionary) -> bool:
	var file = FileAccess.open_encrypted_with_pass(SAVE_PATH, FileAccess.WRITE, ENCRYPTION_KEY)
	if not file:
		printerr("[SaveManager] Échec d'ouverture du fichier de sauvegarde en écriture : ", FileAccess.get_open_error())
		return false
		
	var json_string = JSON.stringify(data)
	file.store_string(json_string)
	file.close()
	print("[SaveManager] Données sauvegardées avec succès (Chiffré).")
	return true

## Charge les données depuis le disque avec déchiffrement
func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		print("[SaveManager] Aucun fichier de sauvegarde trouvé, création des valeurs par défaut.")
		save_game(default_data)
		return default_data.duplicate()
		
	var file = FileAccess.open_encrypted_with_pass(SAVE_PATH, FileAccess.READ, ENCRYPTION_KEY)
	if not file:
		printerr("[SaveManager] Échec de lecture du fichier de sauvegarde chiffré.")
		return default_data.duplicate()
		
	var content = file.get_as_text()
	file.close()
	
	var json = JSON.new()
	var parse_result = json.parse(content)
	if parse_result == OK:
		return json.get_data()
	else:
		printerr("[SaveManager] Données corrompues, retour aux paramètres par défaut.")
		return default_data.duplicate()
