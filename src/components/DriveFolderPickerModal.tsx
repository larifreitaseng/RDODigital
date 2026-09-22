import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X, 
  ArrowLeft, 
  FolderCheck,
  Link2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { 
  DriveAndFolderService, 
  DriveFolderItem, 
  StorageConfig,
  LINKED_DRIVE_FOLDER_ID,
  LINKED_DRIVE_FOLDER_URL
} from '../services/driveAndFolderService';
import { loginWithGoogle, getCachedDriveAccessToken } from '../firebase';

interface BreadcrumbItem {
  id: string; // 'root' for root drive
  name: string;
}

interface DriveFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderConfig: {
    folderId?: string;
    folderName: string;
    folderPath?: string;
    pdfSubfolder?: string;
    photosSubfolder?: string;
    organizeByObra?: boolean;
  }) => void;
  initialFolderId?: string;
  initialFolderName?: string;
  initialPdfSubfolder?: string;
  initialPhotosSubfolder?: string;
  initialOrganizeByObra?: boolean;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const DriveFolderPickerModal: React.FC<DriveFolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  initialFolderId,
  initialFolderName,
  initialPdfSubfolder,
  initialPhotosSubfolder,
  initialOrganizeByObra = true,
  onShowToast
}) => {
  const [token, setToken] = useState<string | null>(getCachedDriveAccessToken());
  const [isConnecting, setIsConnecting] = useState(false);

  // Navigation State
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Meu Drive' }
  ]);
  const [folders, setFolders] = useState<DriveFolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Selected Folder State
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(initialFolderId);
  const [selectedFolderName, setSelectedFolderName] = useState<string>(initialFolderName || 'Diários de Obra - RDO');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>(
    initialFolderId ? (initialFolderName ? `Meu Drive > ${initialFolderName}` : 'Pasta do Drive') : 'Meu Drive > Diários de Obra - RDO'
  );

  // Create Folder State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);

  // Direct Link/ID input mode
  const [inputMode, setInputMode] = useState<'browse' | 'direct_link'>('browse');
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [isVerifyingDirectLink, setIsVerifyingDirectLink] = useState(false);

  // Subfolders configuration
  const [pdfSubfolder, setPdfSubfolder] = useState(initialPdfSubfolder || 'Relatórios em PDF');
  const [photosSubfolder, setPhotosSubfolder] = useState(initialPhotosSubfolder || 'Acervo Fotográfico');
  const [organizeByObra, setOrganizeByObra] = useState(initialOrganizeByObra);

  const currentParentId = breadcrumbs[breadcrumbs.length - 1]?.id || 'root';

  // Load folders for current parent or search
  const loadFolders = useCallback(async (parentId: string, search?: string) => {
    let currentToken = token || getCachedDriveAccessToken();
    if (!currentToken) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const items = await DriveAndFolderService.listDriveFolders(currentToken, parentId, search);
      setFolders(items);
    } catch (err: any) {
      console.error('Erro ao listar pastas:', err);
      setLoadError(err.message || 'Não foi possível carregar as pastas do Drive.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const currentToken = getCachedDriveAccessToken();
    setToken(currentToken);

    if (currentToken) {
      loadFolders('root');
    }

    if (initialFolderId) {
      setSelectedFolderId(initialFolderId);
      setSelectedFolderName(initialFolderName || 'Pasta Selecionada');
    }
  }, [isOpen, initialFolderId, initialFolderName, loadFolders]);

  // Re-load when breadcrumb changes and not searching
  useEffect(() => {
    if (!isOpen || !token || searchQuery.trim()) return;
    loadFolders(currentParentId);
  }, [currentParentId, token, isOpen, searchQuery, loadFolders]);

  // Debounced Search Handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (searchQuery.trim()) {
      setIsSearching(true);
      loadFolders('root', searchQuery.trim());
    } else {
      setIsSearching(false);
      loadFolders(currentParentId);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadFolders(currentParentId);
  };

  // Connect Google Account
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await loginWithGoogle();
      if (res?.cancelled) {
        onShowToast('Conexão com o Google Drive cancelada.', 'info');
        return;
      }
      if (res && res.accessToken) {
        setToken(res.accessToken);
        onShowToast('Google Drive conectado com sucesso!', 'success');
        loadFolders('root');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao autenticar com Google Drive.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Navigate deeper into a folder
  const handleEnterFolder = (folder: DriveFolderItem) => {
    setSearchQuery('');
    setIsSearching(false);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  // Jump to specific breadcrumb level
  const handleBreadcrumbClick = (index: number) => {
    setSearchQuery('');
    setIsSearching(false);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  // Go up one level
  const handleGoUp = () => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(prev => prev.slice(0, prev.length - 1));
    }
  };

  // Select a folder
  const handleSelectFolderItem = (folder: DriveFolderItem) => {
    setSelectedFolderId(folder.id);
    setSelectedFolderName(folder.name);

    // Build breadcrumb path
    const pathPrefix = breadcrumbs.map(b => b.name).join(' > ');
    const fullPath = `${pathPrefix} > ${folder.name}`;
    setSelectedFolderPath(fullPath);
  };

  // Select the current directory folder
  const handleSelectCurrentDirectory = () => {
    const current = breadcrumbs[breadcrumbs.length - 1];
    if (current.id === 'root') {
      setSelectedFolderId(undefined); // undefined means default root / named folder
      setSelectedFolderName('Diários de Obra - RDO (Raiz do Meu Drive)');
      setSelectedFolderPath('Meu Drive');
    } else {
      setSelectedFolderId(current.id);
      setSelectedFolderName(current.name);
      setSelectedFolderPath(breadcrumbs.map(b => b.name).join(' > '));
    }
  };

  // Create new folder via API
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    setIsCreatingLoading(true);
    try {
      const parent = currentParentId === 'root' ? undefined : currentParentId;
      const created = await DriveAndFolderService.createDriveFolder(newFolderName.trim(), token, parent);
      
      onShowToast(`Pasta "${created.name}" criada com sucesso no Drive!`, 'success');
      setNewFolderName('');
      setIsCreatingFolder(false);
      
      // Select the newly created folder
      setSelectedFolderId(created.id);
      setSelectedFolderName(created.name);
      const pathPrefix = breadcrumbs.map(b => b.name).join(' > ');
      setSelectedFolderPath(`${pathPrefix} > ${created.name}`);

      // Refresh list
      loadFolders(currentParentId);
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao criar pasta no Drive.', 'error');
    } finally {
      setIsCreatingLoading(false);
    }
  };

  // Direct link verification
  const handleVerifyDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = DriveAndFolderService.extractDriveFolderId(directLinkInput);
    if (!cleanId) {
      onShowToast('Cole um link válido do Google Drive ou o ID da pasta.', 'info');
      return;
    }

    if (!token) {
      onShowToast('Conecte ao Google Drive primeiro.', 'info');
      return;
    }

    setIsVerifyingDirectLink(true);
    try {
      const details = await DriveAndFolderService.getDriveFolderDetails(cleanId, token);
      if (details) {
        setSelectedFolderId(details.id);
        setSelectedFolderName(details.name);
        setSelectedFolderPath(`Google Drive > ${details.name}`);
        onShowToast(`Pasta identificada: "${details.name}"!`, 'success');
        setInputMode('browse');
      } else {
        // Even if metadata fails due to permissions, allow user to keep the ID
        setSelectedFolderId(cleanId);
        setSelectedFolderName('Pasta por ID / Link');
        setSelectedFolderPath(`Google Drive > ID: ${cleanId}`);
        onShowToast('ID da pasta configurado. Certifique-se de que sua conta tem permissão de gravação.', 'info');
        setInputMode('browse');
      }
    } catch (err) {
      setSelectedFolderId(cleanId);
      setSelectedFolderName('Pasta por ID / Link');
      setSelectedFolderPath(`Google Drive > ID: ${cleanId}`);
      onShowToast('ID da pasta configurado.', 'info');
      setInputMode('browse');
    } finally {
      setIsVerifyingDirectLink(false);
    }
  };

  // Quick select the requested linked folder
  const handleSelectLinkedFolder = async () => {
    const cleanId = LINKED_DRIVE_FOLDER_ID;
    let currentToken = token || getCachedDriveAccessToken();
    if (!currentToken) {
      handleConnect();
      return;
    }
    setIsVerifyingDirectLink(true);
    try {
      const details = await DriveAndFolderService.getDriveFolderDetails(cleanId, currentToken);
      if (details) {
        setSelectedFolderId(details.id);
        setSelectedFolderName(details.name);
        setSelectedFolderPath(`Google Drive > ${details.name}`);
        onShowToast(`Pasta vinculada identificada: "${details.name}"!`, 'success');
      } else {
        setSelectedFolderId(cleanId);
        setSelectedFolderName('Pasta Vinculada do Drive');
        setSelectedFolderPath(`Google Drive > ID: ${cleanId}`);
        onShowToast('Pasta vinculada selecionada!', 'success');
      }
    } catch (err) {
      setSelectedFolderId(cleanId);
      setSelectedFolderName('Pasta Vinculada do Drive');
      setSelectedFolderPath(`Google Drive > ID: ${cleanId}`);
      onShowToast('Pasta vinculada selecionada!', 'success');
    } finally {
      setIsVerifyingDirectLink(false);
    }
  };

  // Confirm selection and close
  const handleConfirm = () => {
    onSelectFolder({
      folderId: selectedFolderId,
      folderName: selectedFolderName,
      folderPath: selectedFolderPath,
      pdfSubfolder: pdfSubfolder.trim() || 'Relatórios em PDF',
      photosSubfolder: photosSubfolder.trim() || 'Acervo Fotográfico',
      organizeByObra
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Escolher Pasta no Google Drive</span>
              </h3>
              <p className="text-xs text-slate-400">Selecione onde salvar relatórios diários em PDF e acervo de fotos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* If not authenticated with Google */}
          {!token ? (
            <div className="text-center py-10 px-4 bg-amber-50/50 rounded-2xl border border-amber-200/60">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Cloud className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Conecte sua conta do Google Drive</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mb-5 leading-relaxed">
                Para explorar suas pastas e escolher o local específico para salvar os PDFs e fotos de suas obras, conecte sua conta do Google.
              </p>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Conectando ao Google...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Conectar Google Drive</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Linked Folder Highlight Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Cloud className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">Pasta Vinculada: 1pPexygCfs55RvKOAvbEUYeAguWIhB67R</span>
                    {selectedFolderId === LINKED_DRIVE_FOLDER_ID && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                        ✓ Ativa
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Pasta fornecida para gravação de relatórios e fotos
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <a
                    href={LINKED_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline flex items-center gap-1 px-1.5 py-1"
                  >
                    <span>Ver no Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {selectedFolderId !== LINKED_DRIVE_FOLDER_ID && (
                    <button
                      type="button"
                      onClick={handleSelectLinkedFolder}
                      disabled={isVerifyingDirectLink}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                    >
                      {isVerifyingDirectLink ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Usar Esta Pasta</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation mode switcher */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputMode('browse')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      inputMode === 'browse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Navegar Pastas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('direct_link')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      inputMode === 'direct_link' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Colar Link ou ID</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-amber-600" />
                  <span>+ Nova Pasta</span>
                </button>
              </div>

              {/* DIRECT LINK / ID INPUT MODE */}
              {inputMode === 'direct_link' ? (
                <form onSubmit={handleVerifyDirectLink} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">Colar Link ou ID de pasta do Google Drive:</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Você pode copiar o link da barra de endereço do seu Google Drive (ex: https://drive.google.com/drive/folders/1aBcDeFg...) ou colar diretamente o ID.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directLinkInput}
                      onChange={(e) => setDirectLinkInput(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingDirectLink || !directLinkInput.trim()}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
                    >
                      {isVerifyingDirectLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Identificar</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* BROWSE MODE */}

                  {/* Create New Folder Inline Box */}
                  {isCreatingFolder && (
                    <form onSubmit={handleCreateFolderSubmit} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <FolderPlus className="w-4 h-4 text-amber-600" />
                          Criar nova pasta dentro de: "{breadcrumbs[breadcrumbs.length - 1]?.name}"
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingFolder(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Nome da pasta (ex: Obras 2026 / Residencial)"
                          className="flex-1 text-xs border border-amber-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isCreatingLoading || !newFolderName.trim()}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        >
                          {isCreatingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Criar</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search Bar & Breadcrumbs */}
                  <div className="space-y-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar pasta por nome no Google Drive..."
                        className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-20 py-2 bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 transition-colors"
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold px-1"
                        >
                          Limpar
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="absolute right-2 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2 py-1 rounded-lg transition-colors"
                        >
                          Buscar
                        </button>
                      )}
                    </form>

                    {/* Breadcrumbs Trail */}
                    {!isSearching && (
                      <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                          {breadcrumbs.map((b, idx) => {
                            const isLast = idx === breadcrumbs.length - 1;
                            return (
                              <React.Fragment key={b.id}>
                                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                <button
                                  type="button"
                                  onClick={() => handleBreadcrumbClick(idx)}
                                  className={`px-1.5 py-0.5 rounded-md truncate max-w-[150px] font-medium transition-colors ${
                                    isLast 
                                      ? 'text-slate-950 font-bold bg-white shadow-2xs border border-slate-200' 
                                      : 'text-amber-700 hover:bg-slate-200'
                                  }`}
                                  title={b.name}
                                >
                                  {b.name}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {breadcrumbs.length > 1 && (
                            <button
                              type="button"
                              onClick={handleGoUp}
                              className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200"
                              title="Subir um nível"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => loadFolders(currentParentId)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200"
                            title="Recarregar"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Folder List Box */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[220px] max-h-[280px] flex flex-col">
                    {/* Current folder select banner */}
                    {!isSearching && (
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Navegando em: <strong>{breadcrumbs[breadcrumbs.length - 1]?.name}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectCurrentDirectory}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                        >
                          Selecionar esta pasta
                        </button>
                      </div>
                    )}

                    {/* Folders List Container */}
                    <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-500" />
                          <span className="text-xs">Buscando pastas no Google Drive...</span>
                        </div>
                      ) : loadError ? (
                        <div className="p-6 text-center text-rose-600 text-xs">
                          <AlertCircle className="w-6 h-6 mx-auto mb-1 text-rose-500" />
                          <span>{loadError}</span>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          <Folder className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          <p className="font-semibold text-slate-600">Nenhuma subpasta encontrada aqui</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Você pode clicar em "Selecionar esta pasta" acima ou criar uma nova clicando em "+ Nova Pasta".
                          </p>
                        </div>
                      ) : (
                        folders.map((folder) => {
                          const isSelected = selectedFolderId === folder.id;
                          return (
                            <div
                              key={folder.id}
                              className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer group ${
                                isSelected ? 'bg-amber-50 border border-amber-300' : 'hover:bg-slate-50'
                              }`}
                              onClick={() => handleSelectFolderItem(folder)}
                              onDoubleClick={() => handleEnterFolder(folder)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-amber-600 group-hover:bg-amber-100'
                                }`}>
                                  <Folder className="w-4 h-4 fill-amber-400/20 stroke-[2]" />
                                </div>
                                <div className="truncate min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                                    {folder.name}
                                  </p>
                                  {folder.modifiedTime && (
                                    <p className="text-[10px] text-slate-400">
                                      Modificado: {new Date(folder.modifiedTime).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectFolderItem(folder);
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                  }`}
                                >
                                  {isSelected ? 'Selecionada' : 'Escolher'}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnterFolder(folder);
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-700 rounded-md hover:bg-amber-100/50"
                                  title="Entrar nesta subpasta"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* CURRENT SELECTION SUMMARY CARD */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderCheck className="w-4 h-4 text-amber-600" />
                    Pasta de Destino Selecionada no Drive:
                  </span>
                  {selectedFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${selectedFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <span>Abrir no Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedFolderName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      Caminho: {selectedFolderPath}
                    </p>
                  </div>
                  {selectedFolderId && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      ID: {selectedFolderId.substring(0, 12)}...
                    </span>
                  )}
                </div>

                {/* Subfolder customization within the selected folder */}
                <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-600" />
                      Subpasta para PDFs:
                    </label>
                    <input
                      type="text"
                      value={pdfSubfolder}
                      onChange={(e) => setPdfSubfolder(e.target.value)}
                      placeholder="Relatórios em PDF"
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-amber-600" />
                      Subpasta para Fotos:
                    </label>
                    <input
                      type="text"
                      value={photosSubfolder}
                      onChange={(e) => setPhotosSubfolder(e.target.value)}
                      placeholder="Acervo Fotográfico"
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={organizeByObra}
                    onChange={(e) => setOrganizeByObra(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Criar automaticamente subpasta com o nome de cada Obra</span>
                </label>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              // Reset to root default
              setSelectedFolderId(undefined);
              setSelectedFolderName('Diários de Obra - RDO');
              setSelectedFolderPath('Meu Drive > Diários de Obra - RDO');
              onShowToast('Destino redefinido para a pasta padrão "Diários de Obra - RDO".', 'info');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Usar Pasta Padrão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar Esta Pasta como Destino
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
