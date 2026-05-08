import os
from typing import Dict, List

import requests

# Configuracion del endpoint remoto de Hugging Face Inference API.
NER_MODEL = "PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus"
NER_URL = f"https://api-inference.huggingface.co/models/{NER_MODEL}"
HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "").strip()
REQUEST_TIMEOUT = 60


def _build_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"
    return headers


def _normalize_label(label: str) -> str:
    """Normaliza etiquetas posibles del modelo."""
    label = (label or "").upper().strip()
    if label.startswith("B-") or label.startswith("I-"):
        label = label[2:]
    if "PER" in label:
        return "PER"
    if "LOC" in label:
        return "LOC"
    if "ORG" in label:
        return "ORG"
    return "MISC"


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Llama al modelo NER remoto y agrupa entidades en categorias amigables.
    """
    try:
        if not text.strip():
            return {
                "personas": [],
                "lugares": [],
                "organizaciones": [],
                "otros": [],
            }

        payload = {
            "inputs": text,
            "parameters": {"aggregation_strategy": "simple"},
            "options": {"wait_for_model": True},
        }
        response = requests.post(
            NER_URL,
            headers=_build_headers(),
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        items = response.json()

        result = {
            "personas": [],
            "lugares": [],
            "organizaciones": [],
            "otros": [],
        }
        dedup = {key: set() for key in result.keys()}

        # Respuesta esperada: lista de entidades agregadas.
        for ent in items if isinstance(items, list) else []:
            label = _normalize_label(str(ent.get("entity_group", ent.get("entity", ""))))
            word = str(ent.get("word", "")).strip()
            if not word:
                continue

            if label == "PER" and word not in dedup["personas"]:
                dedup["personas"].add(word)
                result["personas"].append(word)
            elif label == "LOC" and word not in dedup["lugares"]:
                dedup["lugares"].add(word)
                result["lugares"].append(word)
            elif label == "ORG" and word not in dedup["organizaciones"]:
                dedup["organizaciones"].add(word)
                result["organizaciones"].append(word)
            elif word not in dedup["otros"]:
                dedup["otros"].add(word)
                result["otros"].append(word)

        return result
    except Exception as exc:
        raise RuntimeError(f"Fallo en extraccion de entidades: {str(exc)}") from exc
