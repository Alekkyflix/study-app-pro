"""AWS/Cloud utilities for S3, Supabase, etc."""

class StorageService:
    """Handle cloud storage operations"""
    
    async def upload_audio(self, file_path: str, bucket: str = "audio") -> str:
        """Upload audio file to cloud storage"""
        pass
    
    async def upload_document(self, file_path: str, bucket: str = "documents") -> str:
        """Upload PDF document to cloud storage"""
        pass
    
    async def download_file(self, url: str) -> bytes:
        """Download file from cloud storage"""
        pass
    
    async def delete_file(self, file_url: str) -> bool:
        """Delete file from cloud storage"""
        pass

storage_service = StorageService()
