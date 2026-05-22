import uuid
from azure.storage.blob import BlobServiceClient
from fastapi import HTTPException, UploadFile

from config import get_settings

settings = get_settings()
_blob_service: BlobServiceClient | None = None


def get_blob_service() -> BlobServiceClient:
    global _blob_service
    if _blob_service is None:
        if not settings.AZURE_STORAGE_CONNECTION_STRING:
            raise HTTPException(503, "Azure Blob Storage is not configured")
        _blob_service = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        try:
            _blob_service.create_container(settings.AZURE_BLOB_CONTAINER)
        except Exception:
            pass
    return _blob_service


async def upload_bytes(
    process_id: str,
    filename: str,
    contents: bytes,
    subfolder: str = "files",
) -> str:
    blob_name = f"{process_id}/{subfolder}/{uuid.uuid4()}_{filename}"
    client = get_blob_service().get_blob_client(
        container=settings.AZURE_BLOB_CONTAINER,
        blob=blob_name,
    )
    client.upload_blob(contents, overwrite=True)
    return client.url


async def upload_file(
    process_id: str,
    file: UploadFile,
    subfolder: str = "files",
) -> tuple[str, bytes]:
    contents = await file.read()
    url = await upload_bytes(process_id, file.filename or "file", contents, subfolder)
    return url, contents
