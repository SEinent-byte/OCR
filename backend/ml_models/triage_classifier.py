import re
from typing import Dict

import requests
from dotenv import load_dotenv

from ml_models.hf_env import get_hf_token, hf_token_missing_message

# Carga variables de entorno para token de Hugging Face.
load_dotenv(override=True)

# Modelo de clasificacion compatible con proveedor hf-inference.
CLASSIFIER_MODEL = "finiteautomata/beto-sentiment-analysis"
CLASSIFIER_URL = f"https://router.huggingface.co/hf-inference/models/{CLASSIFIER_MODEL}"


def _headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    token = get_hf_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _infer_document_type(text: str) -> str:
    """Detecta tipo de tramite con reglas de dominio municipal."""
    lower = text.lower()
    type_rules = [
        ("LICENCIA_CONSTRUCCION", [r"licencia de construcci[oó]n", r"obra", r"planos"]),
        ("LICENCIA_FUNCIONAMIENTO", [r"licencia de funcionamiento", r"establecimiento", r"negocio"]),
        ("RECLAMO", [r"reclamo", r"queja", r"disconformidad"]),
        ("DENUNCIA", [r"denuncia", r"infracci[oó]n", r"fiscalizaci[oó]n"]),
        ("CONSTANCIA", [r"constancia", r"certificado", r"acreditaci[oó]n"]),
    ]
    for name, patterns in type_rules:
        if any(re.search(pattern, lower) for pattern in patterns):
            return name
    return "TRAMITE_GENERAL"


def _rule_based_priority(text: str) -> Dict[str, object]:
    """
    Puntaje de urgencia basado en reglas administrativas:
    - plazos cortos, fiscalizacion, riesgo -> ALTA
    - solicitudes estandar -> MEDIA
    - sin senales detectables -> NULA
    """
    lower = text.lower()
    high_signals = [
        r"urgente",
        r"riesgo",
        r"peligro",
        r"infracci[oó]n",
        r"sanci[oó]n",
        r"clausura",
        r"plazo\s*(de)?\s*\d{1,2}\s*d[ií]as",
        r"vencimiento",
    ]
    medium_signals = [
        r"licencia",
        r"reclamo",
        r"subsanaci[oó]n",
        r"expediente",
    ]

    high_hits = sum(1 for pattern in high_signals if re.search(pattern, lower))
    medium_hits = sum(1 for pattern in medium_signals if re.search(pattern, lower))

    score = min(0.99, 0.45 + high_hits * 0.18 + medium_hits * 0.08)
    if high_hits >= 1:
        return {"prioridad": "ALTA", "confianza": round(score, 4)}
    if medium_hits >= 1:
        return {"prioridad": "MEDIA", "confianza": round(max(0.58, score), 4)}
    return {"prioridad": "NULA", "confianza": 0.5}


def classify_document(text: str) -> Dict[str, object]:
    """Clasifica tramite con enfoque hibrido (reglas + apoyo HF)."""
    try:
        if not get_hf_token():
            raise RuntimeError(hf_token_missing_message())
        doc_type = _infer_document_type(text)
        rule_result = _rule_based_priority(text)

        # Apoyo IA: sentimiento en espanol como senal secundaria.
        response = requests.post(
            CLASSIFIER_URL,
            headers=_headers(),
            json={"inputs": text, "options": {"wait_for_model": True}},
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()

        top = {}
        if isinstance(data, list) and data:
            first = data[0]
            if isinstance(first, list) and first:
                top = max(first, key=lambda x: float(x.get("score", 0)))
            elif isinstance(first, dict):
                top = first

        label = str(top.get("label", "NEU")).upper()
        model_score = float(top.get("score", 0.0))

        # Ajuste final: reglas tienen prioridad, el modelo solo corrige limite.
        final_priority = rule_result["prioridad"]
        if label == "NEG" and rule_result["prioridad"] == "MEDIA":
            final_priority = "ALTA"
        elif label == "POS" and rule_result["prioridad"] == "MEDIA":
            final_priority = "BAJA"

        final_conf = max(float(rule_result["confianza"]), round(model_score, 4))
        return {
            "tipo": doc_type,
            "prioridad": final_priority,
            "confianza": round(final_conf, 4),
        }
    except Exception as exc:
        raise RuntimeError(f"Fallo en clasificacion de tramite: {exc}") from exc
