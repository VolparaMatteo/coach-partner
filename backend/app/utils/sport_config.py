"""
Sport-specific configuration for Coach Partner.
Defines positions, roles, training block types, evaluation criteria,
and templates per sport (football, basketball, volleyball).
"""

SPORT_CONFIG = {
    "football": {
        "label": "Calcio",
        "positions": [
            {"value": "goalkeeper", "label": "Portiere"},
            {"value": "center_back", "label": "Difensore Centrale"},
            {"value": "full_back", "label": "Terzino"},
            {"value": "wing_back", "label": "Esterno"},
            {"value": "defensive_mid", "label": "Mediano"},
            {"value": "central_mid", "label": "Centrocampista"},
            {"value": "attacking_mid", "label": "Trequartista"},
            {"value": "winger", "label": "Ala"},
            {"value": "striker", "label": "Attaccante"},
        ],
        "categories": [
            {"value": "U12", "label": "Under 12"},
            {"value": "U14", "label": "Under 14"},
            {"value": "U16", "label": "Under 16"},
            {"value": "U18", "label": "Under 18"},
            {"value": "U21", "label": "Under 21 / Primavera"},
            {"value": "senior", "label": "Senior"},
        ],
        "block_types": [
            {"value": "warmup", "label": "Riscaldamento"},
            {"value": "technical", "label": "Tecnico"},
            {"value": "tactical", "label": "Tattico"},
            {"value": "physical", "label": "Fisico"},
            {"value": "game", "label": "Partitella / Gioco"},
            {"value": "set_piece", "label": "Palle Inattive"},
            {"value": "cooldown", "label": "Defaticamento"},
        ],
        "session_objectives": [
            "Transizioni difensive (5s rule)",
            "Costruzione dal basso vs pressing alto",
            "Palle inattive: corner difensivi (zona + uomo)",
            "Possesso palla e smarcamento",
            "Pressing alto e riaggressione",
            "Costruzione azione offensiva",
            "Difesa a zona",
            "Fase di non possesso",
        ],
        "evaluation_tags": [
            "decision making", "pressing", "build-up", "dribbling",
            "finishing", "set piece", "positioning", "leadership",
            "work rate", "aerial duels", "passing", "crossing",
        ],
        "physical_attribute": "dominant_foot",
    },
    "basketball": {
        "label": "Basket",
        "positions": [
            {"value": "point_guard", "label": "Playmaker (PG)"},
            {"value": "shooting_guard", "label": "Guardia (SG)"},
            {"value": "small_forward", "label": "Ala Piccola (SF)"},
            {"value": "power_forward", "label": "Ala Grande (PF)"},
            {"value": "center", "label": "Centro (C)"},
        ],
        "categories": [
            {"value": "U13", "label": "Under 13"},
            {"value": "U15", "label": "Under 15"},
            {"value": "U17", "label": "Under 17"},
            {"value": "U19", "label": "Under 19"},
            {"value": "senior", "label": "Senior"},
        ],
        "block_types": [
            {"value": "warmup", "label": "Riscaldamento"},
            {"value": "technical", "label": "Tecnico / Skill"},
            {"value": "tactical", "label": "Tattico"},
            {"value": "physical", "label": "Atletico"},
            {"value": "shooting", "label": "Tiro"},
            {"value": "game", "label": "Scrimmage / Gioco"},
            {"value": "special", "label": "Situazioni Speciali"},
            {"value": "cooldown", "label": "Defaticamento"},
        ],
        "session_objectives": [
            "Spaziature e timing (drive & kick)",
            "Closeout e rotazioni difensive",
            "Situazioni speciali: ATO (after timeout)",
            "Pick and roll / Pick and pop",
            "Transizione veloce",
            "Difesa a zona",
            "Rimbalzo offensivo e difensivo",
            "Tiri liberi e routine",
        ],
        "evaluation_tags": [
            "ball handling", "shooting", "defense", "rebounding",
            "passing", "court vision", "pick and roll", "transition",
            "free throw", "leadership", "hustle", "screen setting",
        ],
        "physical_attribute": "dominant_hand",
    },
    "volleyball": {
        "label": "Pallavolo",
        "positions": [
            {"value": "setter", "label": "Palleggiatore"},
            {"value": "outside_hitter", "label": "Schiacciatore / Banda"},
            {"value": "opposite", "label": "Opposto"},
            {"value": "middle_blocker", "label": "Centrale"},
            {"value": "libero", "label": "Libero"},
        ],
        "categories": [
            {"value": "U14", "label": "Under 14"},
            {"value": "U16", "label": "Under 16"},
            {"value": "U18", "label": "Under 18"},
            {"value": "U21", "label": "Under 21"},
            {"value": "senior", "label": "Senior"},
        ],
        "block_types": [
            {"value": "warmup", "label": "Riscaldamento"},
            {"value": "technical", "label": "Tecnico"},
            {"value": "tactical", "label": "Tattico"},
            {"value": "physical", "label": "Atletico"},
            {"value": "serve", "label": "Battuta"},
            {"value": "reception", "label": "Ricezione"},
            {"value": "game", "label": "Set / Gioco"},
            {"value": "cooldown", "label": "Defaticamento"},
        ],
        "session_objectives": [
            "Side-out: ricezione -> cambio palla",
            "Muro-difesa: lettura attaccante e coperture",
            "Battuta tattica: target zone e variazioni",
            "Sistema di ricezione",
            "Combinazioni d'attacco",
            "Copertura d'attacco",
            "Free ball e difesa",
            "Rotazioni e specializzazioni",
        ],
        "evaluation_tags": [
            "serve receive", "setting", "spiking", "blocking",
            "serving", "defense", "coverage", "reading",
            "communication", "leadership", "consistency", "rotation",
        ],
        "physical_attribute": "dominant_hand",
    },
}


def get_sport_config(sport):
    return SPORT_CONFIG.get(sport)


def get_all_sports():
    return [
        {"value": k, "label": v["label"]}
        for k, v in SPORT_CONFIG.items()
    ]
