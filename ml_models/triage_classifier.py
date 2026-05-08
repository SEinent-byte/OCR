import os
from typing import Dict

import requests

# Configuracion del endpoint remoto de Hugging Face Inference API.
CLASSIFIER_MODEL = "PlanTL-GOB-ES/roberta-base-bne-mldoc"
CLASSIFIER_URL = f"https://api-inference.huggingface.co/models/{CLASSIFIER_MODEL}"
HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "").strip()
REQUEST_TIMEOUT = 60


def _build_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"
    return headers


def _priority_from_label(label: str) -> str:
    clean = (label or "").upper().strip()
    if "GCAT" in clean:
        return "ALTA"
    if "ECAT" in clean:
        return "MEDIA"
    if "CCAT" in clean or "MCAT" in clean:
        return "BAJA"
    return "MEDIA"


def classify_document(text: str) -> Dict[str, object]:
    """
    Clasifica el documento y mapea su prioridad operativa.
    """
    try:
        payload = {"inputs": text, "options": {"wait_for_model": True}}
        response = requests.post(
            CLASSIFIER_URL,
            headers=_build_headers(),
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

        # Formato habitual: [[{"label":"GCAT","score":0.95}, ...]]
        top = {}
        if isinstance(data, list) and data:
            first = data[0]
            if isinstance(first, list) and first:
                top = max(first, key=lambda x: float(x.get("score", 0.0)))
            elif isinstance(first, dict):
                top = first

        label = str(top.get("label", "SIN_CATEGORIA"))
        score = float(top.get("score", 0.0))

        return {
            "tipo": label,
            "prioridad": _priority_from_label(label),
            "confianza": round(score, 4),
        }
    except Exception as exc:
        raise RuntimeError(f"Fallo en clasificacion de tramite: {str(exc)}") from exc
