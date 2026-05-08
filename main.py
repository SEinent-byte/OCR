from typing import Dict

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ml_models.ner_extractor import extract_entities
from ml_models.ocr_processor import extract_text
from ml_models.schemas import DocumentResponse, PredictionRequest, PredictionResponse
from ml_models.triage_classifier import classify_document

# Carga variables de entorno al iniciar la app.
load_dotenv()

app = FastAPI(title="SAGT - Sistema Automatizado de Gestion de Tramites")

# CORS abierto para facilitar integracion con frontend en desarrollo/produccion.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _estimate_pages(filename: str, file_bytes: bytes) -> int:
    """Intenta estimar paginas si es PDF; para imagen retorna 1."""
    try:
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            import fitz  # Import local para evitar costo innecesario en imagenes.

            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                return len(document)
        return 1
    except Exception:
        # Si falla el conteo de paginas, devolvemos 0 como valor seguro.
        return 0


@app.get("/health")
async def health() -> Dict[str, str]:
    """Endpoint basico para comprobar que el servicio esta activo."""
    return {"status": "ok"}


@app.get("/")
async def root() -> Dict[str, str]:
    """Ruta raiz para evitar 404 al abrir la API en navegador."""
    return {
        "mensaje": "SAGT API operativa",
        "health": "/health",
        "documentacion": "/docs",
    }


@app.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)) -> DocumentResponse:
    """Recibe PDF/imagen y devuelve texto extraido."""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="El archivo no tiene nombre.")

        allowed_ext = (".pdf", ".png", ".jpg", ".jpeg")
        if not file.filename.lower().endswith(allowed_ext):
            raise HTTPException(
                status_code=400,
                detail="Formato no soportado. Use PDF, PNG, JPG o JPEG.",
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="El archivo esta vacio.")

        extracted_text = extract_text(file_bytes=file_bytes, filename=file.filename)
        pages = _estimate_pages(file.filename, file_bytes)

        return DocumentResponse(
            texto_extraido=extracted_text,
            nombre_archivo=file.filename,
            num_paginas=pages,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Error procesando archivo: {str(exc)}"
        ) from exc


@app.post("/predict", response_model=PredictionResponse)
async def predict_document(payload: PredictionRequest) -> PredictionResponse:
    """Recibe texto y devuelve entidades + clasificacion de prioridad."""
    try:
        text = payload.texto.strip()
        if not text:
            raise HTTPException(status_code=400, detail="El texto no puede estar vacio.")

        entities = extract_entities(text)
        classification = classify_document(text)

        return PredictionResponse(
            entidades=entities,
            clasificacion=classification,
            texto_original=text,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Error durante la prediccion: {str(exc)}"
        ) from exc
