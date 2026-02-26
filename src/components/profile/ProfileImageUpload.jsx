import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, CheckCircle2 } from 'lucide-react';
import { fileUploadService } from '../../services/FileUploadService';
import { auditService } from '../../services/AuditService';

export default function ProfileImageUpload({ currentImageUrl, userId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // Validate file
    const validation = fileUploadService.validateFile(file, 'image');
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const result = await fileUploadService.uploadProfileImage(file, userId);
      
      if (result.success) {
        setSuccess(true);
        
        // Log audit trail
        await auditService.log(
          'PROFILE_IMAGE_UPDATE',
          'user',
          userId,
          { image_url: currentImageUrl },
          { image_url: result.url }
        );

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(result.url);
        }

        // Clear preview after 2 seconds
        setTimeout(() => {
          setPreview(null);
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative inline-block">
        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {preview || currentImageUrl ? (
            <img
              src={preview || currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={48} />
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2.5 bg-white border-2 border-gray-200 rounded-full shadow-lg hover:bg-brand-50 hover:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload new photo"
        >
          {uploading ? (
            <Loader2 size={20} className="text-brand-600 animate-spin" />
          ) : success ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <Upload size={20} className="text-gray-600" />
          )}
        </button>

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">Profile image updated successfully!</p>
        </div>
      )}

      {/* Upload Instructions */}
      <p className="mt-3 text-xs text-gray-600 text-center">
        Click the upload button to change your photo
        <br />
        Max size: 10MB • JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}
