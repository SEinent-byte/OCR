import io
import os
import re
import shutil

import fitz
import pytesseract
from PIL import Image


def _clean_text(text: str) -> str:
    """Limpia texto extraido para mejorar legibilidad."""
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _configure_tesseract() -> None:
    """
    Configura la ruta de Tesseract si viene por variable de entorno
    o detecta una ruta comun en Windows.
    """
    custom_cmd = os.getenv("TESSERACT_CMD", "").strip()
    if custom_cmd:
        pytesseract.pytesseract.tesseract_cmd = custom_cmd
        return

    if shutil.which("tesseract"):
        return

    common_windows_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(common_windows_path):
        pytesseract.pytesseract.tesseract_cmd = common_windows_path


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extrae texto de PDF o imagen con manejo de errores."""
    try:
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            pages = []
            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                for page in document:
                    pages.append(page.get_text("text"))
            return _clean_text("\n".join(pages))

        if lower_name.endswith((".png", ".jpg", ".jpeg")):
            _configure_tesseract()
            image = Image.open(io.BytesIO(file_bytes))
            try:
                # Primero intenta OCR en espanol.
                text = pytesseract.image_to_string(image, lang="spa")
            except Exception:
                # Fallback para instalaciones sin paquete de idioma spa.
                text = pytesseract.image_to_string(image, lang="eng")
            return _clean_text(text)

        raise ValueError("Tipo de archivo no soportado.")
    except Exception as exc:
        message = str(exc)
        if "tesseract is not installed" in message.lower():
            raise RuntimeError(
                "Tesseract OCR no esta instalado o no esta en PATH. "
                "Instalalo y/o define TESSERACT_CMD en .env."
            ) from exc
        raise RuntimeError(f"Fallo en extraccion OCR: {exc}") from exc
