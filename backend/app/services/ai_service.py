"""
AI Service for Coach Partner.
Uses OpenAI API to generate reports and insights.
All outputs are editable by the coach - AI assists, never decides.
"""

import json
import os
from openai import OpenAI


def get_client():
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def generate_post_training_report(session_data, notes, attendances):
    """Generate a post-training session recap."""
    client = get_client()
    if not client:
        return {"error": "AI not configured", "content": None}

    prompt = f"""Sei un assistente per allenatori sportivi. Genera un report post-allenamento
basato SOLO sui dati forniti. Non inventare informazioni.

Sessione: {json.dumps(session_data, ensure_ascii=False)}
Note: {json.dumps(notes, ensure_ascii=False)}
Presenze: {json.dumps(attendances, ensure_ascii=False)}

Struttura del report:
1. **Riassunto sessione** (2-3 frasi)
2. **Cosa ha funzionato** (punti chiave)
3. **Cosa migliorare** (punti chiave)
4. **Suggerimenti per prossima sessione** (2-3 adattamenti concreti)

Se mancano dati, segnalalo chiaramente. Rispondi in italiano."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.7,
    )

    return {
        "content": response.choices[0].message.content,
        "confidence": "medium",
        "prompt_used": prompt,
        "model_used": "gpt-4o-mini",
    }


def generate_post_match_report(match_data, evaluations, notes):
    """Generate a post-match report."""
    client = get_client()
    if not client:
        return {"error": "AI not configured", "content": None}

    prompt = f"""Sei un assistente per allenatori sportivi. Genera un report post-gara
basato SOLO sui dati forniti.

Partita: {json.dumps(match_data, ensure_ascii=False)}
Valutazioni: {json.dumps(evaluations, ensure_ascii=False)}
Note: {json.dumps(notes, ensure_ascii=False)}

Struttura:
1. **Summary** (risultato + sintesi prestazione)
2. **Momenti chiave**
3. **Top 3 priorità allenamento** (basate su cosa migliorare)

Se mancano dati, segnalalo. Rispondi in italiano."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.7,
    )

    return {
        "content": response.choices[0].message.content,
        "confidence": "medium",
        "prompt_used": prompt,
        "model_used": "gpt-4o-mini",
    }


def generate_athlete_weekly_summary(athlete_data, evaluations, wellness, notes):
    """Generate a weekly athlete summary: what happened, readiness trend, practical suggestions."""
    client = get_client()
    if not client:
        return {"error": "AI not configured", "content": None}

    prompt = f"""Sei un assistente per allenatori sportivi. Genera una sintesi settimanale
per un atleta basata SOLO sui dati forniti.

Atleta: {json.dumps(athlete_data, ensure_ascii=False)}
Valutazioni recenti: {json.dumps(evaluations, ensure_ascii=False)}
Wellness: {json.dumps(wellness, ensure_ascii=False)}
Note: {json.dumps(notes, ensure_ascii=False)}

Struttura:
1. **Cosa è successo questa settimana** (sintesi)
2. **Trend readiness** (energia, DOMS, stress)
3. **3 suggerimenti pratici** (con motivazione)

Se mancano dati, chiedilo esplicitamente. Rispondi in italiano."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.7,
    )

    return {
        "content": response.choices[0].message.content,
        "confidence": "medium",
        "prompt_used": prompt,
        "model_used": "gpt-4o-mini",
    }


def synthesize_coach_notes(notes_list):
    """Transform sparse coach notes into 3 insights + 1 recommendation."""
    client = get_client()
    if not client:
        return {"error": "AI not configured", "content": None}

    prompt = f"""Sei un assistente per allenatori. Analizza queste note sparse dell'allenatore
e trasformale in insight utili. Basati SOLO sulle note fornite.

Note: {json.dumps(notes_list, ensure_ascii=False)}

Output:
1. **3 Insight chiave** (pattern che emergono dalle note)
2. **1 Raccomandazione** (azione concreta suggerita)

Se le note sono poche o poco significative, dillo. Rispondi in italiano."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.7,
    )

    return {
        "content": response.choices[0].message.content,
        "confidence": "low" if len(notes_list) < 3 else "medium",
        "prompt_used": prompt,
        "model_used": "gpt-4o-mini",
    }
