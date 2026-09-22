import JSZip from 'jszip';

/**
 * Storage Options: Google Drive and Local Notebook Folder
 * Allows storing RDO PDFs, Photos, and full backups with customizable destination paths.
 */

export type StorageTargetMode = 'firebase' | 'drive' | 'local_folder';

export interface StorageConfig {
  saveToFirebase: boolean;
  saveToDrive: boolean;
  saveToLocalFolder: boolean;
  
  // Google Drive custom paths
  driveFolderId?: string;               // Specific chosen Drive Folder ID
  driveFolderName?: string;            // Default root folder or name: "Diários de Obra - RDO"
  driveFolderPath?: string;            // Visual breadcrumb path: e.g. "Meu Drive > Obras 2026 > Central"
  drivePdfSubfolder?: string;           // Custom folder name for PDFs: e.g. "Relatórios em PDF"
  drivePhotosSubfolder?: string;        // Custom folder name for Photos: e.g. "Acervo Fotográfico"
  driveOrganizeByObra?: boolean;        // Whether to nest inside Obra folder: default true
  
  // Local Notebook custom paths
  localFolderName?: string;             // Display name of chosen directory / download root
  localPdfSubfolder?: string;           // Custom folder name for PDFs: e.g. "Relatórios_PDF"
  localPhotosSubfolder?: string;        // Custom folder name for Photos: e.g. "Fotos_Diarias"
  localOrganizeByObra?: boolean;        // Whether to nest inside Obra folder: default true

  // Auto-sync behavior
  autoSavePdfOnEmit?: boolean;          // Save PDF when RDO is saved/emitted
  autoSavePhotosOnEmit?: boolean;       // Save attached photos when RDO is saved/emitted
}

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  parents?: string[];
  webViewLink?: string;
  modifiedTime?: string;
}

export const LINKED_DRIVE_FOLDER_ID = '1pPexygCfs55RvKOAvbEUYeAguWIhB67R';
export const LINKED_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1pPexygCfs55RvKOAvbEUYeAguWIhB67R?usp=drive_link';

export interface UserGoogleAccount {
  userId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  uid?: string;
  accessToken?: string;
  connectedAt?: string;
}

const STORAGE_CONFIG_KEY = 'rdo_storage_config_v2';

// In-memory reference to user-selected local directory handle (when supported and granted)
let currentDirectoryHandle: any = null;

export const DriveAndFolderService = {
  getUserConfigKey(userId?: string): string {
    return userId ? `rdo_storage_config_user_${userId}` : STORAGE_CONFIG_KEY;
  },

  getUserGoogleAccountKey(userId?: string): string {
    return userId ? `rdo_google_account_user_${userId}` : 'rdo_google_account_default';
  },

  getConfig(userId?: string): StorageConfig {
    try {
      const key = this.getUserConfigKey(userId);
      const saved = localStorage.getItem(key) || (userId ? localStorage.getItem(STORAGE_CONFIG_KEY) : null) || localStorage.getItem('rdo_storage_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          saveToFirebase: parsed.saveToFirebase ?? true,
          saveToDrive: parsed.saveToDrive ?? false,
          saveToLocalFolder: false,
          driveFolderId: parsed.driveFolderId || LINKED_DRIVE_FOLDER_ID,
          driveFolderName: parsed.driveFolderName || 'Pasta Vinculada do Drive',
          driveFolderPath: parsed.driveFolderPath || 'Google Drive > Pasta Vinculada',
          drivePdfSubfolder: parsed.drivePdfSubfolder || 'Relatórios em PDF',
          drivePhotosSubfolder: parsed.drivePhotosSubfolder || 'Acervo Fotográfico',
          driveOrganizeByObra: parsed.driveOrganizeByObra ?? true,
          localFolderName: 'Downloads/RDO_Engenharia',
          localPdfSubfolder: 'Relatórios_PDF',
          localPhotosSubfolder: 'Fotos_Diarias',
          localOrganizeByObra: true,
          autoSavePdfOnEmit: parsed.autoSavePdfOnEmit ?? true,
          autoSavePhotosOnEmit: parsed.autoSavePhotosOnEmit ?? true,
        };
      }
    } catch (e) {
      console.error('Error loading storage config:', e);
    }
    return {
      saveToFirebase: true,
      saveToDrive: false,
      saveToLocalFolder: false,
      driveFolderId: LINKED_DRIVE_FOLDER_ID,
      driveFolderName: 'Pasta Vinculada do Drive',
      driveFolderPath: 'Google Drive > Pasta Vinculada',
      drivePdfSubfolder: 'Relatórios em PDF',
      drivePhotosSubfolder: 'Acervo Fotográfico',
      driveOrganizeByObra: true,
      localFolderName: 'Downloads/RDO_Engenharia',
      localPdfSubfolder: 'Relatórios_PDF',
      localPhotosSubfolder: 'Fotos_Diarias',
      localOrganizeByObra: true,
      autoSavePdfOnEmit: true,
      autoSavePhotosOnEmit: true
    };
  },

  saveConfig(config: StorageConfig, userId?: string) {
    try {
      const key = this.getUserConfigKey(userId);
      localStorage.setItem(key, JSON.stringify(config));
      // Also update default key if no specific userId
      if (!userId) {
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
      }
    } catch (e) {
      console.error('Error saving storage config:', e);
    }
  },

  getGoogleAccount(userId?: string): UserGoogleAccount | null {
    try {
      const key = this.getUserGoogleAccountKey(userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao ler conta Google do usuário:', e);
    }
    return null;
  },

  saveGoogleAccount(account: UserGoogleAccount | null, userId?: string) {
    try {
      const key = this.getUserGoogleAccountKey(userId);
      if (account) {
        localStorage.setItem(key, JSON.stringify(account));
      } else {
        localStorage.removeItem(key);
      }
      if (!userId) {
        if (account) {
          localStorage.setItem('rdo_google_account_default', JSON.stringify(account));
        } else {
          localStorage.removeItem('rdo_google_account_default');
        }
      }
    } catch (e) {
      console.warn('Erro ao salvar conta Google do usuário:', e);
    }
  },

  clearGoogleAccount(userId?: string) {
    try {
      const key = this.getUserGoogleAccountKey(userId);
      localStorage.removeItem(key);
      if (!userId) {
        localStorage.removeItem('rdo_google_account_default');
      }
    } catch (e) {
      console.warn('Erro ao limpar conta Google do usuário:', e);
    }
  },

  /**
   * Check if running in an iframe (sub-frame)
   */
  isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return true;
    }
  },

  // ----------------------------------------------------
  // LOCAL FOLDER (NOTEBOOK/PC) STORAGE
  // ----------------------------------------------------
  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window && !this.isInIframe();
  },

  hasActiveDirectoryHandle(): boolean {
    return currentDirectoryHandle !== null;
  },

  getCurrentDirectoryName(): string | null {
    return currentDirectoryHandle?.name || null;
  },

  /**
   * Prompts user to pick a physical folder using the browser's native directory picker (Windows Explorer / Mac Finder)
   */
  async tryPickNativeFolder(): Promise<{ 
    success: boolean; 
    folderName?: string; 
    subfolders?: string[];
    handle?: any;
    error?: string;
    isIframeBlocked?: boolean;
  }> {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      return { 
        success: false, 
        error: 'Seu navegador não suporta a API de seleção direta de pastas (showDirectoryPicker). Você pode escolher ou digitar o caminho desejado.' 
      };
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      currentDirectoryHandle = dirHandle;

      // Scan immediate subfolders existing inside the selected directory
      const subfolders: string[] = [];
      try {
        for await (const entry of (dirHandle as any).values()) {
          if (entry.kind === 'directory') {
            subfolders.push(entry.name);
          }
        }
      } catch (scanErr) {
        console.warn('Erro ao ler subpastas existentes:', scanErr);
      }

      const config = this.getConfig();
      config.saveToLocalFolder = true;
      config.localFolderName = dirHandle.name;
      this.saveConfig(config);

      return {
        success: true,
        folderName: dirHandle.name,
        subfolders,
        handle: dirHandle
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Seleção de pasta cancelada pelo usuário.' };
      }

      if (err.name === 'SecurityError' || String(err.message).includes('Cross origin') || String(err.message).includes('sub frame') || String(err.message).includes('subframe')) {
        return {
          success: false,
          isIframeBlocked: true,
          error: 'O navegador bloqueou o seletor nativo direto dentro do frame. Utilize a opção de identificação de pasta ou selecione um dos locais recomendados.'
        };
      }

      console.warn('Erro ao selecionar pasta física:', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao acessar pasta no computador.' 
      };
    }
  },

  /**
   * Get active directory handle for direct disk operations
   */
  getCurrentDirectoryHandle() {
    return currentDirectoryHandle;
  },

  /**
   * Physically create a new subfolder in the connected directory handle
   */
  async createLocalSubfolder(subfolderName: string): Promise<{ success: boolean; error?: string }> {
    if (!currentDirectoryHandle) {
      return { success: false, error: 'Nenhuma pasta física aberta com permissão de escrita.' };
    }
    try {
      const sanitized = subfolderName.trim().replace(/[\\/:*?"<>|]/g, '_');
      await (currentDirectoryHandle as any).getDirectoryHandle(sanitized, { create: true });
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao criar subpasta no notebook:', err);
      return { success: false, error: err.message || 'Falha ao criar subpasta no computador.' };
    }
  },

  /**
   * Scans root and subfolders from a folder selected via directory file input
   */
  scanFolderFromFiles(files: FileList): { rootFolder: string; subfolders: string[] } {
    const subfolderSet = new Set<string>();
    let rootFolder = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = (file as any).webkitRelativePath || '';
      if (relativePath) {
        const parts = relativePath.split('/');
        if (parts.length > 0 && !rootFolder) {
          rootFolder = parts[0];
        }
        // If there are subfolders inside root
        if (parts.length > 2) {
          subfolderSet.add(parts[1]);
        }
      }
    }

    return {
      rootFolder: rootFolder || 'Pasta do Notebook',
      subfolders: Array.from(subfolderSet)
    };
  },

  /**
   * Apply user's custom chosen storage folder path and subfolders
   */
  applyLocalFolderSelection(
    folderName: string,
    pdfSubfolder?: string,
    photosSubfolder?: string,
    organizeByObra?: boolean
  ): StorageConfig {
    const config = this.getConfig();
    config.saveToLocalFolder = true;
    config.localFolderName = folderName.trim() || 'Documentos/Engenharia_RDO';
    if (pdfSubfolder !== undefined) config.localPdfSubfolder = pdfSubfolder.trim() || 'Relatórios_PDF';
    if (photosSubfolder !== undefined) config.localPhotosSubfolder = photosSubfolder.trim() || 'Fotos_Diarias';
    if (organizeByObra !== undefined) config.localOrganizeByObra = organizeByObra;
    
    this.saveConfig(config);
    return config;
  },

  /**
   * Prompts user to pick a folder from their notebook / computer.
   */
  async pickLocalFolder(customName?: string): Promise<{ 
    success: boolean; 
    folderName?: string; 
    error?: string;
    isFallback?: boolean;
    isIframeBlocked?: boolean;
  }> {
    // Attempt native folder picker first
    const nativeRes = await this.tryPickNativeFolder();
    if (nativeRes.success) {
      return {
        success: true,
        folderName: nativeRes.folderName,
        isFallback: false
      };
    }

    if (nativeRes.error && nativeRes.error.includes('cancelada')) {
      return { success: false, error: nativeRes.error };
    }

    // If blocked by iframe or unsupported, use user's configured/chosen name without forcing "Downloads"
    const chosenName = customName?.trim() || 'Documentos/Engenharia_RDO';
    const config = this.getConfig();
    config.saveToLocalFolder = true;
    config.localFolderName = chosenName;
    this.saveConfig(config);

    return {
      success: true,
      folderName: chosenName,
      isFallback: true,
      isIframeBlocked: nativeRes.isIframeBlocked,
      error: nativeRes.error
    };
  },

  /**
   * Save a single Blob directly into the user's selected local folder or trigger browser download
   * Supports multi-level nested folders: e.g. "Residencial Jardins/Fotos_Diarias"
   */
  async saveFileToLocalFolder(
    fileName: string,
    blob: Blob,
    subfolderPath?: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      if (currentDirectoryHandle) {
        let targetDir = currentDirectoryHandle;

        if (subfolderPath) {
          // Support multiple directory path segments (e.g. "Obra/Fotos")
          const segments = subfolderPath.split('/').map(s => s.replace(/[\\/:*?"<>|]/g, '_').trim()).filter(Boolean);
          for (const seg of segments) {
            targetDir = await targetDir.getDirectoryHandle(seg, { create: true });
          }
        }

        const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return {
          success: true,
          path: subfolderPath ? `${currentDirectoryHandle.name}/${subfolderPath}/${fileName}` : `${currentDirectoryHandle.name}/${fileName}`
        };
      }

      // Download Fallback: triggers safe file save in user's browser download folder
      this.downloadBlobFallback(blob, fileName);
      return { 
        success: true, 
        path: `Downloads/${subfolderPath ? subfolderPath + '/' : ''}${fileName}` 
      };
    } catch (err: any) {
      console.warn('Fallback para download direto do arquivo:', err);
      this.downloadBlobFallback(blob, fileName);
      return { success: true, path: `Downloads/${fileName}` };
    }
  },

  /**
   * Packages multiple files and subdirectories into a structured ZIP file
   * and downloads it directly to the user's computer.
   */
  async downloadZipPackage(
    zipFileName: string,
    files: Array<{ relativePath: string; blob: Blob }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const zip = new JSZip();
      for (const item of files) {
        zip.file(item.relativePath, item.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlobFallback(zipBlob, zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`);
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao gerar pacote zip:', err);
      return { success: false, error: err.message || 'Falha ao gerar arquivo zip.' };
    }
  },

  downloadBlobFallback(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  },

  // ----------------------------------------------------
  // GOOGLE DRIVE STORAGE (API v3)
  // ----------------------------------------------------

  /**
   * Validates if a Google Drive OAuth access token is still active and returns user profile
   */
  async validateDriveAccessToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    displayName?: string;
    photoUrl?: string;
    error?: string;
  }> {
    if (!token || !token.trim()) {
      return { valid: false, error: 'Token não informado' };
    }
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          return { valid: false, error: 'Token do Google Drive expirado. É necessário reconectar.' };
        }
        return { valid: false, error: `Google Drive respondeu com status ${res.status}` };
      }
      const data = await res.json();
      return {
        valid: true,
        email: data.user?.emailAddress || '',
        displayName: data.user?.displayName || '',
        photoUrl: data.user?.photoLink || ''
      };
    } catch (e: any) {
      return { valid: false, error: e?.message || 'Falha ao verificar token com a API do Google Drive' };
    }
  },

  /**
   * Requests a Google Drive OAuth access token directly using Google Identity Services (GSI)
   * This is especially useful on Netlify/GitHub where Firebase Auth domain permissions might be pending.
   */
  async requestGoogleDriveTokenGSI(clientId?: string): Promise<{ accessToken: string; email?: string } | null> {
    const effectiveClientId = clientId?.trim() || '596099900954-6qnpgb8rdemfd61gq58dtp01tms6vh92.apps.googleusercontent.com';

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Ambiente de navegador indisponível'));
        return;
      }

      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services (GSI) não foi carregado. Recarregue a página ou verifique a conexão.'));
        return;
      }

      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Falha ao obter permissão do Google Drive'));
              return;
            }
            if (tokenResponse.access_token) {
              resolve({
                accessToken: tokenResponse.access_token
              });
            } else {
              resolve(null);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Extracts clean folder ID from a Drive URL or ID string
   */
  extractDriveFolderId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
    // Remove query params or trailing slashes if any
    return trimmed.split('?')[0].replace(/\/+$/, '');
  },

  /**
   * Lists existing folders in Google Drive under a parent folder or by search query
   */
  async listDriveFolders(accessToken: string, parentId?: string, search?: string): Promise<DriveFolderItem[]> {
    try {
      let q = `mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (search && search.trim()) {
        const cleanSearch = search.trim().replace(/'/g, "\\'");
        q += ` and name contains '${cleanSearch}'`;
      } else if (parentId && parentId !== 'root') {
        q += ` and '${parentId}' in parents`;
      } else {
        q += ` and 'root' in parents`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents,modifiedTime,webViewLink)&pageSize=100&orderBy=name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!res.ok) {
        console.warn('Falha na resposta do Google Drive ao listar pastas:', res.status);
        return [];
      }
      const data = await res.json();
      return data.files || [];
    } catch (err) {
      console.warn('Erro ao listar pastas do Drive:', err);
      return [];
    }
  },

  /**
   * Fetches metadata for a specific Google Drive folder by ID
   */
  async getDriveFolderDetails(folderId: string, accessToken: string): Promise<DriveFolderItem | null> {
    try {
      const cleanId = this.extractDriveFolderId(folderId);
      if (!cleanId) return null;
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,parents,modifiedTime,webViewLink`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Erro ao obter detalhes da pasta do Drive:', err);
      return null;
    }
  },

  /**
   * Creates a new folder in Google Drive
   */
  async createDriveFolder(
    folderName: string,
    accessToken: string,
    parentId?: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    const cleanName = folderName.trim() || 'Nova Pasta';
    const folderMetadata: any = {
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentId && parentId !== 'root') {
      folderMetadata.parents = [parentId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderMetadata)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Falha ao criar pasta no Drive (${createRes.status}): ${errText}`);
    }

    const created = await createRes.json();
    return { id: created.id, name: created.name, webViewLink: created.webViewLink };
  },

  /**
   * Resolves the effective target base folder ID in Google Drive.
   * If user configured a specific driveFolderId, validates and returns it.
   * Otherwise, finds or creates the folder configured in driveFolderName.
   */
  async resolveDriveTargetFolder(config: StorageConfig, accessToken: string): Promise<string> {
    const rawTargetId = config.driveFolderId || LINKED_DRIVE_FOLDER_ID;
    if (rawTargetId) {
      const cleanId = this.extractDriveFolderId(rawTargetId);
      if (cleanId) {
        try {
          const details = await this.getDriveFolderDetails(cleanId, accessToken);
          if (details && details.id) {
            // Update folder name and breadcrumb in local storage if not properly set yet
            if (details.name && (!config.driveFolderName || config.driveFolderName === 'Diários de Obra - RDO' || config.driveFolderName === 'Pasta Vinculada do Drive')) {
              config.driveFolderId = details.id;
              config.driveFolderName = details.name;
              config.driveFolderPath = `Google Drive > ${details.name}`;
              this.saveConfig(config);
            }
            return details.id;
          }
        } catch (e) {
          console.warn('Não foi possível obter metadados da pasta no Drive, prosseguindo com o ID informado:', e);
        }
        // Return cleanId directly so upload uses it as parent folder
        return cleanId;
      }
    }
    const targetName = config.driveFolderName?.trim() || 'Diários de Obra - RDO';
    return await this.getOrCreateDriveFolder(targetName, accessToken);
  },

  /**
   * Apply specific Drive folder selection to storage configuration
   */
  applyDriveFolderSelection(
    folderId: string | undefined,
    folderName: string,
    folderPath?: string,
    pdfSubfolder?: string,
    photosSubfolder?: string,
    organizeByObra?: boolean,
    userId?: string
  ): StorageConfig {
    const config = this.getConfig(userId);
    config.saveToDrive = true;
    config.driveFolderId = folderId ? this.extractDriveFolderId(folderId) : undefined;
    config.driveFolderName = folderName.trim() || 'Diários de Obra - RDO';
    config.driveFolderPath = folderPath?.trim();
    if (pdfSubfolder !== undefined) config.drivePdfSubfolder = pdfSubfolder.trim() || 'Relatórios em PDF';
    if (photosSubfolder !== undefined) config.drivePhotosSubfolder = photosSubfolder.trim() || 'Acervo Fotográfico';
    if (organizeByObra !== undefined) config.driveOrganizeByObra = organizeByObra;

    this.saveConfig(config, userId);
    return config;
  },

  /**
   * Search or create a folder in Google Drive
   */
  async getOrCreateDriveFolder(
    folderName: string,
    accessToken: string,
    parentId?: string
  ): Promise<string> {
    try {
      const cleanName = folderName.trim() || 'Nova Pasta';
      let q = `mimeType='application/vnd.google-apps.folder' and name='${cleanName.replace(/'/g, "\\'")}' and trashed=false`;
      if (parentId) {
        q += ` and '${parentId}' in parents`;
      } else {
        q += ` and 'root' in parents`;
      }

      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          return searchData.files[0].id;
        }
      }

      const folderMetadata: any = {
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder'
      };
      if (parentId) {
        folderMetadata.parents = [parentId];
      }

      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderMetadata)
      });

      if (!createRes.ok) {
        throw new Error(`Falha ao criar pasta no Drive: ${createRes.statusText}`);
      }

      const created = await createRes.json();
      return created.id;
    } catch (err) {
      console.error('Erro getOrCreateDriveFolder:', err);
      throw err;
    }
  },

  /**
   * Uploads a file (PDF, image) to Google Drive using multipart upload
   */
  async uploadFileToDrive(
    fileName: string,
    mimeType: string,
    blob: Blob,
    accessToken: string,
    folderId?: string
  ): Promise<DriveUploadResult> {
    try {
      const metadata: any = {
        name: fileName,
        mimeType: mimeType
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const reader = new FileReader();
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        closeDelim;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Erro Drive Upload (${uploadRes.status}): ${errorText}`);
      }

      const result = await uploadRes.json();
      return result;
    } catch (error) {
      console.error('Falha no envio ao Google Drive:', error);
      throw error;
    }
  },

  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },

  downloadBlobInBrowser(fileName: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};
