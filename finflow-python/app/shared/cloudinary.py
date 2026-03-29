import cloudinary
import cloudinary.uploader
from app.core.config import get_settings


def init_cloudinary() -> None:
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )


def upload_file(file_path: str, folder: str = "finflow/reports") -> str:
    result = cloudinary.uploader.upload(
        file_path,
        folder=folder,
        resource_type="raw",   # ✅ let Cloudinary detect it as PDF
        format="pdf",           # ✅ explicitly keep .pdf extension in URL
        access_mode="public",   # ✅ ensure public access
    )
    return result["secure_url"]  # ✅ no .replace() needed — URL is already correct