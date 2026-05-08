from typing import Dict, List

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    texto_extraido: str
    nombre_archivo: str
    num_paginas: int


class PredictionRequest(BaseModel):
    texto: str


class PredictionResponse(BaseModel):
    entidades: Dict[str, List[str]]
    clasificacion: Dict[str, object]
    texto_original: str
