/**
 * GOOGLE DRIVE INTEGRATION FOR FIRE PROTECTION
 * Handles OAuth, file upload, and folder management
 */

import { supabase } from './supabase.js';

// ============================================================
// CONFIGURATION
// ============================================================

const DRIVE_CONFIG = {
  FOLDER_STRUCTURE: {
    ROOT: 'SLF_Project',
    FIRE_PROTECTION: 'Fire_Protection',
    SUBFOLDERS: {
      PHOTOS: 'Photos',
      REPORTS: 'Reports',
      STANDARDS: 'Standards',
      DOCUMENTS: 'Documents'
    }
  },
  MIME_TYPES: {
    FOLDER: 'application/vnd.google-apps.folder',
    IMAGE: 'image/jpeg',
    PDF: 'application/pdf'
  }
};

// ============================================================
// AUTHENTICATION
// ============================================================

export async function initializeGoogleAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      return { status: 'redirecting', url: data.url };
    }
    
    return { 
      status: 'authenticated', 
      accessToken: session.provider_token,
      refreshToken: session.provider_refresh_token 
    };
  } catch (error) {
    console.error('Google Auth Error:', error);
    return { status: 'error', error: error.message };
  }
}

export async function refreshGoogleToken() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    return {
      accessToken: session?.provider_token,
      refreshToken: session?.provider_refresh_token
    };
  } catch (error) {
    console.error('Token Refresh Error:', error);
    return null;
  }
}

// ============================================================
// FOLDER MANAGEMENT
// ============================================================

export async function getOrCreateProjectFolder(projectName, accessToken) {
  try {
    // Search for existing root folder
    const rootFolder = await findFolder(DRIVE_CONFIG.FOLDER_STRUCTURE.ROOT, 'root', accessToken);
    
    let rootFolderId;
    if (rootFolder) {
      rootFolderId = rootFolder.id;
    } else {
      // Create root folder
      rootFolderId = await createFolder(DRIVE_CONFIG.FOLDER_STRUCTURE.ROOT, null, accessToken);
    }
    
    // Create project folder
    const projectFolderName = `${DRIVE_CONFIG.FOLDER_STRUCTURE.ROOT}/${projectName}`;
    let projectFolder = await findFolder(projectFolderName, rootFolderId, accessToken);
    
    if (!projectFolder) {
      projectFolder = { id: await createFolder(projectName, rootFolderId, accessToken) };
    }
    
    // Create Fire Protection folder
    const fireFolder = await getOrCreateSubfolder(
      DRIVE_CONFIG.FOLDER_STRUCTURE.FIRE_PROTECTION,
      projectFolder.id,
      accessToken
    );
    
    // Create subfolders
    const subfolders = {};
    for (const [key, name] of Object.entries(DRIVE_CONFIG.FOLDER_STRUCTURE.SUBFOLDERS)) {
      subfolders[key] = await getOrCreateSubfolder(name, fireFolder, accessToken);
    }
    
    return {
      rootId: rootFolderId,
      projectId: projectFolder.id,
      fireProtectionId: fireFolder,
      subfolders
    };
  } catch (error) {
    console.error('Folder Creation Error:', error);
    throw error;
  }
}

async function findFolder(name, parentId, accessToken) {
  try {
    const query = parentId 
      ? `name='${name}' and mimeType='${DRIVE_CONFIG.MIME_TYPES.FOLDER}' and '${parentId}' in parents and trashed=false`
      : `name='${name}' and mimeType='${DRIVE_CONFIG.MIME_TYPES.FOLDER}' and trashed=false`;
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    const data = await response.json();
    return data.files?.[0] || null;
  } catch (error) {
    console.error('Find Folder Error:', error);
    return null;
  }
}

async function createFolder(name, parentId, accessToken) {
  try {
    const metadata = {
      name,
      mimeType: DRIVE_CONFIG.MIME_TYPES.FOLDER,
      ...(parentId && { parents: [parentId] })
    };
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Create Folder Error:', error);
    throw error;
  }
}

async function getOrCreateSubfolder(name, parentId, accessToken) {
  const existing = await findFolder(name, parentId, accessToken);
  if (existing) return existing.id;
  return await createFolder(name, parentId, accessToken);
}

// ============================================================
// FILE UPLOAD
// ============================================================

export async function uploadInspectionPhoto(file, projectName, metadata = {}, accessToken) {
  try {
    // Get or create folder structure
    const folders = await getOrCreateProjectFolder(projectName, accessToken);
    
    // Prepare file metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `inspection_${metadata.assetType || 'general'}_${timestamp}.jpg`;
    
    const fileMetadata = {
      name: filename,
      parents: [folders.subfolders.PHOTOS],
      description: JSON.stringify({
        timestamp: metadata.timestamp || new Date().toISOString(),
        geotag: metadata.geotag || null,
        inspector: metadata.inspector || 'Unknown',
        assetType: metadata.assetType || 'general',
        location: metadata.location || 'Unknown',
        projectId: metadata.projectId,
        inspectionId: metadata.inspectionId
      })
    };
    
    // Upload file
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    formData.append('file', file);
    
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Save to Supabase
    await saveFileReference({
      project_id: metadata.projectId,
      inspection_id: metadata.inspectionId,
      file_id: result.id,
      file_url: result.webViewLink,
      direct_url: `https://drive.google.com/uc?id=${result.id}`,
      file_type: 'image/jpeg',
      file_name: filename,
      folder_path: `/${DRIVE_CONFIG.FOLDER_STRUCTURE.ROOT}/${projectName}/${DRIVE_CONFIG.FOLDER_STRUCTURE.FIRE_PROTECTION}/${DRIVE_CONFIG.FOLDER_STRUCTURE.SUBFOLDERS.PHOTOS}`,
      metadata: {
        timestamp: metadata.timestamp,
        geotag: metadata.geotag,
        inspector: metadata.inspector,
        assetType: metadata.assetType,
        location: metadata.location
      }
    });
    
    return {
      fileId: result.id,
      viewUrl: result.webViewLink,
      embedUrl: `https://drive.google.com/uc?id=${result.id}`,
      filename
    };
  } catch (error) {
    console.error('Upload Photo Error:', error);
    throw error;
  }
}

export async function uploadReport(file, projectName, metadata = {}, accessToken) {
  try {
    const folders = await getOrCreateProjectFolder(projectName, accessToken);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Fire_Protection_Report_${timestamp}.pdf`;
    
    const fileMetadata = {
      name: filename,
      parents: [folders.subfolders.REPORTS],
      description: JSON.stringify({
        type: 'fire_protection_report',
        projectId: metadata.projectId,
        generatedAt: metadata.generatedAt || new Date().toISOString(),
        generatedBy: metadata.generatedBy || 'System'
      })
    };
    
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    formData.append('file', file);
    
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Save to Supabase
    await saveFileReference({
      project_id: metadata.projectId,
      file_id: result.id,
      file_url: result.webViewLink,
      file_type: 'application/pdf',
      file_name: filename,
      folder_path: `/${DRIVE_CONFIG.FOLDER_STRUCTURE.ROOT}/${projectName}/${DRIVE_CONFIG.FOLDER_STRUCTURE.FIRE_PROTECTION}/${DRIVE_CONFIG.FOLDER_STRUCTURE.SUBFOLDERS.REPORTS}`,
      metadata: {
        type: 'fire_protection_report',
        generatedAt: metadata.generatedAt,
        generatedBy: metadata.generatedBy
      }
    });
    
    return {
      fileId: result.id,
      viewUrl: result.webViewLink,
      filename
    };
  } catch (error) {
    console.error('Upload Report Error:', error);
    throw error;
  }
}

// ============================================================
// SUPABASE INTEGRATION
// ============================================================

async function saveFileReference(fileData) {
  try {
    const { data, error } = await supabase
      .from('fire_inspection_files')
      .insert(fileData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Save File Reference Error:', error);
    // Don't throw - file was uploaded to Drive successfully
    return null;
  }
}

export async function getFilesForInspection(inspectionId) {
  try {
    const { data, error } = await supabase
      .from('fire_inspection_files')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Files Error:', error);
    return [];
  }
}

export async function getFilesForProject(projectId, fileType = null) {
  try {
    let query = supabase
      .from('fire_inspection_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (fileType) {
      query = query.eq('file_type', fileType);
    }
    
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Project Files Error:', error);
    return [];
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getGoogleDriveEmbedUrl(fileId) {
  return `https://drive.google.com/uc?id=${fileId}`;
}

export function getGoogleDriveThumbnailUrl(fileId, size = 400) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export async function deleteFile(fileId, accessToken) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
    
    // Also delete from Supabase
    await supabase
      .from('fire_inspection_files')
      .delete()
      .eq('file_id', fileId);
    
    return true;
  } catch (error) {
    console.error('Delete File Error:', error);
    throw error;
  }
}

// ============================================================
// HOOKS FOR MODULE INTEGRATION
// ============================================================

export async function uploadInspectionPhotosBatch(files, project, metadata, onProgress = null) {
  const auth = await initializeGoogleAuth();
  if (auth.status !== 'authenticated') {
    throw new Error('Google Drive not authenticated');
  }
  
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadInspectionPhoto(
        files[i],
        project.nama_bangunan,
        {
          ...metadata,
          projectId: project.id
        },
        auth.accessToken
      );
      
      results.push({ success: true, ...result });
      
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      results.push({ success: false, error: error.message, filename: files[i].name });
    }
  }
  
  return results;
}

export async function syncProjectFilesToSupabase(projectId) {
  try {
    // Trigger Supabase Edge Function for logging
    const { data, error } = await supabase.functions.invoke('sync-fire-files', {
      body: { project_id: projectId }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sync Files Error:', error);
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  initializeGoogleAuth,
  refreshGoogleToken,
  getOrCreateProjectFolder,
  uploadInspectionPhoto,
  uploadReport,
  getFilesForInspection,
  getFilesForProject,
  getGoogleDriveEmbedUrl,
  getGoogleDriveThumbnailUrl,
  deleteFile,
  uploadInspectionPhotosBatch,
  syncProjectFilesToSupabase,
  DRIVE_CONFIG
};
