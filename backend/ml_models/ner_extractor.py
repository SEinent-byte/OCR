import os
import re
from typing import Dict, List

import requests
from dotenv import load_dotenv

# Carga variables de entorno (solo local; en Railway se inyectan por dashboard).
load_dotenv(override=True)

# Modelo NER compatible con proveedor hf-inference.
NER_MODEL = "mrm8488/bert-spanish-cased-finetuned-ner"
NER_URL = f"https://router.huggingface.co/hf-inference/models/{NER_MODEL}"


def _get_hf_token() -> str:
    """Obtiene token actual de entorno en tiempo de ejecucion."""
    return (
        (os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_TOKEN") or "").strip()
    )


def _headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    token = _get_hf_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _normalize_label(label: str) -> str:
    label = (label or "").upper().strip()
    if label.startswith(("B-", "I-")):
        label = label[2:]
    if "PER" in label:
        return "PER"
    if "LOC" in label:
        return "LOC"
    if "ORG" in label:
        return "ORG"
    return "MISC"


def _clean_entity(value: str) -> str:
    """Limpia artefactos frecuentes del modelo NER."""
    value = value.replace("##", "").strip(" ,.;:-")
    value = re.sub(r"\s+", " ", value)
    return value


def _is_noise(value: str) -> bool:
    """Descarta tokens sin valor semantico."""
    if not value:
        return True
    if len(value) <= 1:
        return True
    if value in {"@", "#", "##"}:
        return True
    if re.fullmatch(r"[\W_]+", value):
        return True
    return False


def _extract_rule_entities(text: str) -> Dict[str, List[str]]:
    """
    Extrae entidades de alta precision con patrones administrativos:
    nombre completo, ubicaciones y organizaciones.
    """
    results = {"personas": [], "lugares": [], "organizaciones": [], "otros": []}

    person_match = re.search(r"nombre\s+completo\s*:\s*([^\n\r]+)", text, flags=re.IGNORECASE)
    if person_match:
        results["personas"].append(_clean_entity(person_match.group(1)))

    place_patterns = [
        r"distrito\s+de\s+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)",
        r"ubicaci[oó]n\s*:\s*([^\n\r]+)",
        r"direcci[oó]n\s*:\s*([^\n\r]+)",
    ]
    for pattern in place_patterns:
        for match in re.findall(pattern, text, flags=re.IGNORECASE):
            results["lugares"].append(_clean_entity(match))

    org_patterns = [
        r"empresa\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\.\s]+)",
        r"constructora\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\.\s]+)",
    ]
    for pattern in org_patterns:
        for match in re.findall(pattern, text, flags=re.IGNORECASE):
            results["organizaciones"].append(_clean_entity(match))

    if dni := re.search(r"\bDNI\s*[:\-]?\s*(\d{8})\b", text, flags=re.IGNORECASE):
        results["otros"].append(f"DNI:{dni.group(1)}")
    if ruc := re.search(r"\bRUC\s*[:\-]?\s*(\d{11})\b", text, flags=re.IGNORECASE):
        results["otros"].append(f"RUC:{ruc.group(1)}")

    return results


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extrae entidades llamando a HuggingFace Inference API."""
    try:
        if not _get_hf_token():
            raise RuntimeError("HF_TOKEN no configurado en variables de entorno.")
        if not text.strip():
            return {"personas": [], "lugares": [], "organizaciones": [], "otros": []}

        response = requests.post(
            NER_URL,
            headers=_headers(),
            json={
                "inputs": text,
                "parameters": {"aggregation_strategy": "simple"},
                "options": {"wait_for_model": True},
            },
            timeout=60,
        )
        response.raise_for_status()
        items = response.json()

        result = _extract_rule_entities(text)
        seen = {key: set() for key in result.keys()}
        for key in result:
            for item in result[key]:
                seen[key].add(item.lower())

        for ent in items if isinstance(items, list) else []:
            label = _normalize_label(str(ent.get("entity_group", ent.get("entity", ""))))
            word = _clean_entity(str(ent.get("word", "")).strip())
            if _is_noise(word):
                continue

            target = "otros"
            if label == "PER":
                target = "personas"
            elif label == "LOC":
                target = "lugares"
            elif label == "ORG":
                target = "organizaciones"

            normalized = word.lower()
            if normalized not in seen[target]:
                seen[target].add(normalized)
                result[target].append(word)

        return result
    except Exception as exc:
        raise RuntimeError(f"Fallo en extraccion de entidades: {exc}") from exc
