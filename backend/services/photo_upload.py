import os
import base64
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

class PhotoUploadService:
    """Service for handling photo uploads (medications, insurance, ID)"""
    
    def __init__(self):
        # Configure upload directory
        self.upload_dir = Path("/app/backend/uploads")
        self.upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories for different photo types
        self.photo_dirs = {
            "medications": self.upload_dir / "medications",
            "insurance": self.upload_dir / "insurance",
            "identification": self.upload_dir / "identification"
        }
        
        for dir_path in self.photo_dirs.values():
            dir_path.mkdir(exist_ok=True)
    
    async def upload_photo(
        self, 
        photo_base64: str, 
        photo_type: str,
        patient_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload and store a photo
        
        Args:
            photo_base64: Base64 encoded image
            photo_type: Type of photo (medication, insurance_front, insurance_back, id_front, id_back)
            patient_id: Patient identifier
            metadata: Additional metadata (medication name, insurance carrier, etc.)
            
        Returns:
            Dictionary with upload result and file path
        """
        try:
            # Determine category from photo_type
            if "insurance" in photo_type:
                category = "insurance"
            elif "id" in photo_type:
                category = "identification"
            else:
                category = "medications"
            
            # Decode base64 image
            try:
                # Remove data URL prefix if present
                if "," in photo_base64:
                    photo_base64 = photo_base64.split(",")[1]
                
                image_data = base64.b64decode(photo_base64)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Invalid base64 image: {str(e)}"
                }
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{patient_id}_{photo_type}_{timestamp}_{file_id}.jpg"
            
            # Save to appropriate directory
            file_path = self.photo_dirs[category] / filename
            
            with open(file_path, "wb") as f:
                f.write(image_data)
            
            logger.info(f"Photo uploaded: {file_path}")
            
            # Create response
            return {
                "success": True,
                "file_id": file_id,
                "filename": filename,
                "file_path": str(file_path),
                "photo_type": photo_type,
                "patient_id": patient_id,
                "metadata": metadata or {},
                "uploaded_at": datetime.now().isoformat(),
                "file_size": len(image_data)
            }
            
        except Exception as e:
            logger.error(f"Photo upload failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_patient_photos(
        self, 
        patient_id: str,
        photo_category: Optional[str] = None
    ) -> Dict:
        """
        Retrieve all photos for a patient
        
        Args:
            patient_id: Patient identifier
            photo_category: Optional filter (medications, insurance, identification)
            
        Returns:
            List of photo metadata
        """
        try:
            photos = []
            
            # Determine which directories to search
            if photo_category:
                search_dirs = {photo_category: self.photo_dirs[photo_category]}
            else:
                search_dirs = self.photo_dirs
            
            # Search for patient photos
            for category, dir_path in search_dirs.items():
                if dir_path.exists():
                    for file_path in dir_path.glob(f"{patient_id}_*"):
                        # Parse filename for metadata
                        parts = file_path.stem.split("_")
                        
                        photos.append({
                            "filename": file_path.name,
                            "file_path": str(file_path),
                            "category": category,
                            "photo_type": parts[1] if len(parts) > 1 else "unknown",
                            "timestamp": parts[2] if len(parts) > 2 else "unknown",
                            "file_size": file_path.stat().st_size,
                            "uploaded_at": datetime.fromtimestamp(
                                file_path.stat().st_ctime
                            ).isoformat()
                        })
            
            return {
                "success": True,
                "patient_id": patient_id,
                "photo_count": len(photos),
                "photos": photos
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve photos: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_photo(self, file_path: str) -> Dict:
        """Delete a photo file"""
        try:
            path = Path(file_path)
            if path.exists() and path.is_file():
                path.unlink()
                logger.info(f"Photo deleted: {file_path}")
                return {
                    "success": True,
                    "message": "Photo deleted successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "File not found"
                }
        except Exception as e:
            logger.error(f"Failed to delete photo: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_photo(self, photo_base64: str, max_size_mb: int = 10) -> Dict:
        """
        Validate photo before upload
        
        Args:
            photo_base64: Base64 encoded image
            max_size_mb: Maximum allowed size in megabytes
            
        Returns:
            Validation result
        """
        try:
            # Remove data URL prefix if present
            if "," in photo_base64:
                photo_base64 = photo_base64.split(",")[1]
            
            # Decode and check size
            image_data = base64.b64decode(photo_base64)
            size_mb = len(image_data) / (1024 * 1024)
            
            if size_mb > max_size_mb:
                return {
                    "valid": False,
                    "error": f"File size ({size_mb:.2f} MB) exceeds maximum ({max_size_mb} MB)"
                }
            
            # Check if it's a valid image format (basic check)
            # JPG starts with FF D8 FF, PNG starts with 89 50 4E 47
            if not (image_data[:3] == b'\xff\xd8\xff' or  # JPEG
                    image_data[:4] == b'\x89PNG'):  # PNG
                return {
                    "valid": False,
                    "error": "Invalid image format. Only JPEG and PNG are supported."
                }
            
            return {
                "valid": True,
                "size_mb": size_mb,
                "format": "JPEG" if image_data[:3] == b'\xff\xd8\xff' else "PNG"
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Validation failed: {str(e)}"
            }
