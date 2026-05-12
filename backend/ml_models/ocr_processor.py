import io
import os
import re
import shutil

import fitz
import pytesseract
from PIL import Image


PDF_MIN_TEXT_CHARS = 60


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


def _image_to_text(image: Image.Image) -> str:
    """Aplica OCR a una imagen PIL usando espanol con fallback a ingles."""
    try:
        return pytesseract.image_to_string(image, lang="spa")
    except Exception:
        return pytesseract.image_to_string(image, lang="eng")


def _ocr_pdf_pages(document: fitz.Document) -> str:
    """Hace OCR pagina por pagina para PDFs escaneados."""
    ocr_pages = []
    for page in document:
        pix = page.get_pixmap(dpi=220)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        ocr_pages.append(_image_to_text(image))
    return _clean_text("\n".join(ocr_pages))


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extrae texto de PDF o imagen con manejo de errores."""
    try:
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            pages_text = []
            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                for page in document:
                    pages_text.append(page.get_text("text"))
                extracted = _clean_text("\n".join(pages_text))
                # Si el PDF viene escaneado, el texto embebido suele ser vacio o muy corto.
                if len(extracted) < PDF_MIN_TEXT_CHARS:
                    _configure_tesseract()
                    return _ocr_pdf_pages(document)
                return extracted

        if lower_name.endswith((".png", ".jpg", ".jpeg")):
            _configure_tesseract()
            image = Image.open(io.BytesIO(file_bytes))
            text = _image_to_text(image)
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
