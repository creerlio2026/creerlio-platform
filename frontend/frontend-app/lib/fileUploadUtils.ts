// File upload utilities with persistent storage
import {
  saveVideoToIndexedDB,
  getVideosFromIndexedDB,
  deleteVideoFromIndexedDB,
  cleanupOldVideos,
  videoFileToDataURL,
  isIndexedDBSupported,
  type VideoFile
} from './indexedDBUtils';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data URL
  uploadedAt: number;
  category: 'profile' | 'portfolio' | 'resume' | 'certificate' | 'logo' | 'cover' | 'video';
}

const STORAGE_KEY_PREFIX = 'creerlio_uploads_';

/**
 * Save uploaded file to appropriate storage (IndexedDB for videos, localStorage for others)
 * Note: localStorage has ~5-10MB limit. Videos use IndexedDB for larger capacity.
 */
export async function saveUploadedFile(
  userId: string, 
  category: string, 
  file: UploadedFile,
  originalFile?: File
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use IndexedDB for video files to avoid localStorage quota issues
    if (category === 'video') {
      if (!isIndexedDBSupported()) {
        const errorMsg = 'Your browser does not support video storage. Please use a modern browser like Chrome, Firefox, or Edge.';
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!originalFile) {
        const errorMsg = 'Original video file is required for IndexedDB storage';
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Try to save to IndexedDB
      try {
        await saveVideoToIndexedDB(userId, originalFile);
        return { success: true };
      } catch (dbError) {
        const errorMsg = 'Failed to save video. Your browser storage may be full. Try removing old videos.';
        console.error('IndexedDB save error:', dbError);
        return { success: false, error: errorMsg };
      }
    }

    // Use localStorage for other file types
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${category}`;
    const existing = await getUploadedFiles(userId, category);
    const updated = [...existing, file];
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return { success: true };
    } catch (storageError) {
      // Handle quota exceeded error
      if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        
        // Try to clear old files
        clearOldFiles(userId);
        
        // Retry save with just the new file
        try {
          localStorage.setItem(storageKey, JSON.stringify([file]));
          return { 
            success: true, 
            error: 'Storage was full. Old files were removed to make space for this upload.' 
          };
        } catch (retryError) {
          const errorMsg = `Storage quota exceeded. File size: ${formatFileSize(file.size)}. Try uploading a smaller file or clearing old uploads.`;
          console.error('Failed to save file even after cleanup:', retryError);
          return { success: false, error: errorMsg };
        }
      }
      throw storageError;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to save file';
    console.error('Error saving file:', error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get all uploaded files for a user and category
 * Videos are retrieved from IndexedDB, other files from localStorage
 */
export async function getUploadedFiles(userId: string, category: string): Promise<UploadedFile[]> {
  try {
    // Get videos from IndexedDB
    if (category === 'video') {
      if (!isIndexedDBSupported()) {
        console.warn('IndexedDB not supported');
        return [];
      }

      const videoFiles = await getVideosFromIndexedDB(userId);
      
      // Convert VideoFile format to UploadedFile format
      const uploadedFiles: UploadedFile[] = await Promise.all(
        videoFiles.map(async (video) => {
          const dataUrl = await videoFileToDataURL(video);
          return {
            id: video.id,
            name: video.name,
            type: video.type,
            size: video.size,
            dataUrl,
            uploadedAt: video.uploadedAt,
            category: 'video' as const
          };
        })
      );
      
      return uploadedFiles;
    }

    // Get other files from localStorage
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${category}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading files:', error);
    return [];
  }
}

/**
 * Get a single file by ID
 */
export async function getUploadedFile(userId: string, category: string, fileId: string): Promise<UploadedFile | null> {
  const files = await getUploadedFiles(userId, category);
  return files.find(f => f.id === fileId) || null;
}

/**
 * Remove a file by ID
 * Videos are removed from IndexedDB, other files from localStorage
 */
export async function removeUploadedFile(userId: string, category: string, fileId: string): Promise<void> {
  try {
    // Remove video from IndexedDB
    if (category === 'video') {
      if (isIndexedDBSupported()) {
        await deleteVideoFromIndexedDB(fileId);
      }
      return;
    }

    // Remove other files from localStorage
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${category}`;
    const existing = await getUploadedFiles(userId, category);
    const updated = existing.filter(f => f.id !== fileId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing file:', error);
  }
}

/**
 * Clear all files for a category
 * Videos are cleared from IndexedDB, other files from localStorage
 */
export async function clearUploadedFiles(userId: string, category: string): Promise<void> {
  try {
    if (category === 'video' && isIndexedDBSupported()) {
      const videos = await getVideosFromIndexedDB(userId);
      for (const video of videos) {
        await deleteVideoFromIndexedDB(video.id);
      }
      return;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${category}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing files:', error);
  }
}

/**
 * Clear old files (older than 30 days) to free up space
 * Also clears old videos from IndexedDB
 */
async function clearOldFiles(userId: string): Promise<void> {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const categories = ['profile', 'portfolio', 'resume', 'certificate', 'logo', 'cover'];
  
  // Clear old files from localStorage
  categories.forEach(async (category) => {
    const files = await getUploadedFiles(userId, category);
    const recentFiles = files.filter(f => f.uploadedAt > thirtyDaysAgo);
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${category}`;
    localStorage.setItem(storageKey, JSON.stringify(recentFiles));
  });

  // Clear old videos from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await cleanupOldVideos(userId, 30);
    } catch (error) {
      console.error('Error cleaning up old videos:', error);
    }
  }
}

/**
 * Convert File object to UploadedFile with base64 encoding
 */
export async function fileToUploadedFile(
  file: File,
  category: UploadedFile['category']
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
        uploadedAt: Date.now(),
        category
      };
      resolve(uploadedFile);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload file to cloud storage (backend API)
 * This would be implemented when backend endpoints are ready
 */
export async function uploadToCloudStorage(file: File, category: string): Promise<string> {
  // TODO: Implement actual cloud upload when API is ready
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url; // Cloud storage URL
  } catch (error) {
    console.error('Cloud upload error:', error);
    throw error;
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // Check file type
  const isValidType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  });
  
  if (!isValidType) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Get total storage used by user (in bytes)
 * Includes both localStorage and IndexedDB storage
 */
export async function getTotalStorageUsed(userId: string): Promise<number> {
  const categories = ['profile', 'portfolio', 'resume', 'certificate', 'logo', 'cover'];
  let total = 0;
  
  // Calculate localStorage usage
  for (const category of categories) {
    const files = await getUploadedFiles(userId, category);
    total += files.reduce((sum, file) => sum + file.size, 0);
  }
  
  // Add IndexedDB video storage
  if (isIndexedDBSupported()) {
    try {
      const videos = await getVideosFromIndexedDB(userId);
      total += videos.reduce((sum, video) => sum + video.size, 0);
    } catch (error) {
      console.error('Error calculating video storage:', error);
    }
  }
  
  return total;
}

/**
 * Check if storage quota is available
 * Note: IndexedDB has much larger limits than localStorage
 */
export async function hasStorageQuota(userId: string, additionalBytes: number): Promise<boolean> {
  const MAX_STORAGE = 10 * 1024 * 1024; // 10MB limit for localStorage
  const used = await getTotalStorageUsed(userId);
  return (used + additionalBytes) < MAX_STORAGE;
}
