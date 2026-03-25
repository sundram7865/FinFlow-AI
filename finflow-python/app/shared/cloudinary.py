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
        resource_type="raw",
    )
    return result["secure_url"]