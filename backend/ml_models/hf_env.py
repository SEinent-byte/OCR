"""Lectura del token de Hugging Face desde variables de entorno (Railway, local, etc.)."""
from __future__ import annotations

import os
from typing import Final

# Nombres habituales; Railway a veces sugiere HUGGINGFACE_API_TOKEN.
_ENV_KEYS: Final[tuple[str, ...]] = (
    "HF_TOKEN",
    "HUGGINGFACE_API_TOKEN",
    "HF_HUB_TOKEN",
    "HUGGINGFACE_HUB_TOKEN",
)


def get_hf_token() -> str:
    """Devuelve el token si existe; cadena vacia si no hay ninguno valido."""
    # Mapa mayusculas -> valor (Linux distingue mayusculas en getenv; esto cubre variantes).
    upper_env = {k.upper(): (v or "").strip() for k, v in os.environ.items()}
    for key in _ENV_KEYS:
        val = upper_env.get(key.upper(), "")
        if val:
            return val
    return ""


def hf_token_missing_message() -> str:
    return (
        "Ningun token de Hugging Face en el entorno del proceso. "
        "En Railway: Variables de ESTE servicio (backend), agrega una de: "
        f"{', '.join(_ENV_KEYS)} "
        "con el valor del token Read (hf_...) de huggingface.co/settings/tokens. "
        "Redeploy despues de guardar."
    )
