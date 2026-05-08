import io
import re

import fitz
import pytesseract
from PIL import Image


def _clean_text(text: str) -> str:
    """Limpia espacios repetidos y saltos innecesarios."""
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extrae texto de PDF o imagen.
    - PDF: PyMuPDF
    - PNG/JPG/JPEG: pytesseract con idioma espanol
    """
    try:
        lower_name = filename.lower()

        if lower_name.endswith(".pdf"):
            pages_text = []
            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                for page in document:
                    page_text = page.get_text("text")
                    if page_text:
                        pages_text.append(page_text)
            return _clean_text("\n".join(pages_text))

        if lower_name.endswith((".png", ".jpg", ".jpeg")):
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image, lang="spa")
            return _clean_text(text)

        raise ValueError("Tipo de archivo no soportado para OCR.")
    except Exception as exc:
        raise RuntimeError(f"Fallo en extraccion OCR: {str(exc)}") from exc
