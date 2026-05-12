from typing import Dict, Optional
import re

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ml_models.ner_extractor import extract_entities
from ml_models.ocr_processor import extract_text
from ml_models.schemas import DocumentResponse, PredictionRequest, PredictionResponse
from ml_models.triage_classifier import classify_document

# Carga variables de entorno para entorno local/despliegue.
load_dotenv(override=True)

app = FastAPI(
    title="SAGT - Sistema Automatizado de Gestion de Tramites",
    redirect_slashes=False,
)


def _estimate_pages(filename: str, file_bytes: bytes) -> int:
    """Cuenta paginas para PDF y retorna 1 en imagen."""
    try:
        if filename.lower().endswith(".pdf"):
            import fitz

            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                return len(document)
        return 1
    except Exception:
        return 0


@app.get("/")
async def root() -> Dict[str, str]:
    """Ruta raiz para diagnostico rapido."""
    return {"mensaje": "SAGT API operativa", "health": "/health", "docs": "/docs"}


@app.get("/health")
async def health() -> Dict[str, str]:
    """Estado basico del servicio."""
    return {"status": "ok"}


@app.post("/upload", response_model=DocumentResponse)
@app.post("/upload/", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)) -> DocumentResponse:
    """Recibe PDF/imagen y devuelve texto extraido."""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="El archivo no tiene nombre.")
        if not file.filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
            raise HTTPException(status_code=400, detail="Formato no soportado.")

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="El archivo esta vacio.")

        extracted_text = extract_text(file_bytes=file_bytes, filename=file.filename)
        return DocumentResponse(
            texto_extraido=extracted_text,
            nombre_archivo=file.filename,
            num_paginas=_estimate_pages(file.filename, file_bytes),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {exc}") from exc


@app.post("/predict", response_model=PredictionResponse)
@app.post("/predict/", response_model=PredictionResponse)
async def predict_document(payload: PredictionRequest) -> PredictionResponse:
    """Recibe texto y responde entidades + clasificacion."""
    try:
        text = payload.texto.strip()
        if not text:
            raise HTTPException(status_code=400, detail="El texto no puede estar vacio.")

        return PredictionResponse(
            entidades=extract_entities(text),
            clasificacion=classify_document(text),
            texto_original=text,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error durante la prediccion: {exc}") from exc


def _cors_allow_origin(origin: Optional[str]) -> str:
    if not origin:
        return "*"
    if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
        return origin
    if re.match(r"^https://.+\.vercel\.app$", origin, re.I):
        return origin
    return "*"


class GlobalCORSMiddleware(BaseHTTPMiddleware):
    """Capa externa: OPTIONS y cabeceras CORS en todas las respuestas (incl. errores)."""

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        allow = _cors_allow_origin(origin)
        if request.method == "OPTIONS":
            req_headers = request.headers.get("access-control-request-headers", "*")
            return Response(
                status_code=204,
                headers={
                    "Access-Control-Allow-Origin": allow,
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": req_headers,
                    "Access-Control-Max-Age": "86400",
                },
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = allow
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response


app.add_middleware(GlobalCORSMiddleware)
