import httpx
import pdfplumber
import tempfile
import os
from app.core.logging import logger


async def download_and_extract(file_url: str) -> tuple[str, list[str]]:
    """
    Downloads PDF from Cloudinary URL.
    Extracts text page by page.
    Returns (full_text, list_of_page_texts).
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(file_url, timeout=30.0)
        response.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    pages     = []
    full_text = ""

    try:
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages.append(text)
                full_text += text + "\n"
        logger.info(f"Extracted {len(pages)} pages from PDF")
    finally:
        os.unlink(tmp_path)

    return full_text, pages