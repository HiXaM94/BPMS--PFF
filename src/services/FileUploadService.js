/**
 * FileUploadService.js
 * Handle file uploads to Supabase Storage with tracking
 */

import { supabase } from './supabase';

class FileUploadService {
  constructor() {
    this.bucketName = 'bpms-files';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
  }

  /**
   * Validate file before upload
   */
  validateFile(file, type = 'image') {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return { valid: false, errors };
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
    }

    const allowedTypes = type === 'image' ? this.allowedImageTypes : this.allowedDocTypes;
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique file path
   */
  generateFilePath(userId, fileName, entityType = 'general') {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${entityType}/${userId}/${timestamp}_${sanitizedName}`;
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(file, userId) {
    try {
      const validation = this.validateFile(file, 'image');
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const filePath = this.generateFilePath(userId, file.name, 'profile_images');

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Track upload in database
      await this.trackUpload({
        uploaded_by: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        entity_type: 'profile_image',
        entity_id: userId,
        metadata: {
          public_url: publicUrl,
          dimensions: await this.getImageDimensions(file)
        }
      });

      // Update user profile with new image URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return {
        success: true,
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(file, userId, entityType = 'document', entityId = null, metadata = {}) {
    try {
      const validation = this.validateFile(file, 'document');
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const filePath = this.generateFilePath(userId, file.name, entityType);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Get user's entreprise
      const { data: profile } = await supabase
        .from('users')
        .select('entreprise_id')
        .eq('id', userId)
        .single();

      // Track upload
      const { data: uploadRecord } = await this.trackUpload({
        uploaded_by: userId,
        entreprise_id: profile?.entreprise_id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        entity_type: entityType,
        entity_id: entityId,
        metadata: {
          ...metadata,
          public_url: publicUrl
        }
      });

      return {
        success: true,
        url: publicUrl,
        path: filePath,
        uploadId: uploadRecord?.id
      };
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  /**
   * Track file upload in database
   */
  async trackUpload(uploadData) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .insert(uploadData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to track upload:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath, uploadId = null) {
    try {
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Update database record if uploadId provided
      if (uploadId) {
        await supabase
          .from('file_uploads')
          .delete()
          .eq('id', uploadId);
      }

      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  /**
   * Get user's uploaded files
   */
  async getUserFiles(userId, entityType = null) {
    try {
      let query = supabase
        .from('file_uploads')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get user files:', error);
      return [];
    }
  }

  /**
   * Get image dimensions
   */
  getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      img.src = url;
    });
  }

  /**
   * Export data to CSV
   */
  exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? '');
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export data to JSON
   */
  exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import CSV file
   */
  async importFromCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file is empty or invalid'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const fileUploadService = new FileUploadService();
