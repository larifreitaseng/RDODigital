import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Folder, 
  FolderCheck, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Shield, 
  Info,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Check,
  Settings2,
  FolderPlus,
  FolderTree,
  FolderSync,
  X,
  Copy,
  Key,
  Globe,
  CheckCheck
} from 'lucide-react';
import { Obra, RelatorioDiarioObra } from '../types';
import { 
  DriveAndFolderService, 
  StorageConfig, 
  DriveFolderItem,
  LINKED_DRIVE_FOLDER_ID,
  LINKED_DRIVE_FOLDER_URL
} from '../services/driveAndFolderService';
import { loginWithGoogle, getCachedDriveAccessToken, setCachedDriveAccessToken, auth } from '../firebase';
import { obterPdfBlob } from '../services/pdfService';
import { DriveFolderPickerModal } from './DriveFolderPickerModal';

interface StorageSettingsProps {
  obras: Obra[];
  rdos: RelatorioDiarioObra[];
  currentUser?: any;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const StorageSettings: React.FC<StorageSettingsProps> = ({
  obras,
  rdos,
  currentUser,
  onShowToast
}) => {
  const [config, setConfig] = useState<StorageConfig>(() => DriveAndFolderService.getConfig(currentUser?.id));
  const [googleUser, setGoogleUser] = useState<any>(auth.currentUser);
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(getCachedDriveAccessToken());

  // Hostname & Netlify Detection
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNetlifyOrCustom = Boolean(
    currentHostname &&
    (currentHostname.includes('netlify.app') ||
     currentHostname.includes('github.io') ||
     (!currentHostname.includes('localhost') && !currentHostname.includes('127.0.0.1')))
  );

  // Token Validation Status
  const [tokenStatus, setTokenStatus] = useState<{
    checking: boolean;
    valid?: boolean;
    error?: string;
    email?: string;
  }>({ checking: false });
  const [manualToken, setManualToken] = useState('');
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [isCopiedDomain, setIsCopiedDomain] = useState(false);
  const [showNetlifyGuide, setShowNetlifyGuide] = useState(isNetlifyOrCustom);

  // Google Drive Specific Folder Modal state
  const [isDriveFolderModalOpen, setIsDriveFolderModalOpen] = useState(false);

  // Drive folder exploration / picker
  const [availableDriveFolders, setAvailableDriveFolders] = useState<DriveFolderItem[]>([]);
  const [isLoadingDriveFolders, setIsLoadingDriveFolders] = useState(false);
  const [isCustomDriveFolderInput, setIsCustomDriveFolderInput] = useState(false);

  // Sync / Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [selectedObraId, setSelectedObraId] = useState<string>('todas');
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);

  // Validate Token status
  const checkTokenValidity = async (tok?: string | null) => {
    const tokenToCheck = tok !== undefined ? tok : (driveToken || getCachedDriveAccessToken());
    if (!tokenToCheck) {
      setTokenStatus({ checking: false, valid: false, error: 'Nenhum token ativo encontrado.' });
      return;
    }
    setTokenStatus({ checking: true });
    try {
      const val = await DriveAndFolderService.validateDriveAccessToken(tokenToCheck);
      if (val.valid) {
        setTokenStatus({ checking: false, valid: true, email: val.email });
      } else {
        setTokenStatus({ checking: false, valid: false, error: val.error || 'Token expirado ou inválido.' });
      }
    } catch (e: any) {
      setTokenStatus({ checking: false, valid: false, error: e.message || 'Falha ao validar token.' });
    }
  };

  useEffect(() => {
    if (driveToken) {
      checkTokenValidity(driveToken);
    } else {
      setTokenStatus({ checking: false, valid: false });
    }
  }, [driveToken]);

  // Re-sync configuration and Google account when currentUser changes
  useEffect(() => {
    const userCfg = DriveAndFolderService.getConfig(currentUser?.id);
    setConfig(userCfg);
    const userGoogle = DriveAndFolderService.getGoogleAccount(currentUser?.id);
    if (userGoogle) {
      if (userGoogle.accessToken) {
        setDriveToken(userGoogle.accessToken);
        setCachedDriveAccessToken(userGoogle.accessToken);
      }
      setGoogleUser({
        email: userGoogle.email,
        displayName: userGoogle.displayName,
        photoURL: userGoogle.photoUrl
      });
    } else {
      setGoogleUser(auth.currentUser);
      setDriveToken(getCachedDriveAccessToken());
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const userGoogle = DriveAndFolderService.getGoogleAccount(currentUser?.id);
      if (!userGoogle) {
        setGoogleUser(user);
        const token = getCachedDriveAccessToken();
        setDriveToken(token);
        if (token) {
          loadDriveFolders(token);
          fetchFolderMetadata(token);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  const fetchFolderMetadata = async (token: string) => {
    const targetId = config.driveFolderId || LINKED_DRIVE_FOLDER_ID;
    if (targetId) {
      try {
        const details = await DriveAndFolderService.getDriveFolderDetails(targetId, token);
        if (details && details.name) {
          setConfig((prev) => {
            const updated = {
              ...prev,
              driveFolderId: details.id,
              driveFolderName: details.name,
              driveFolderPath: `Google Drive > ${details.name}`
            };
            DriveAndFolderService.saveConfig(updated, currentUser?.id);
            return updated;
          });
        }
      } catch (e) {
        console.warn('Erro ao obter metadados da pasta vinculada:', e);
      }
    }
  };

  const loadDriveFolders = async (token: string) => {
    setIsLoadingDriveFolders(true);
    try {
      const folders = await DriveAndFolderService.listDriveFolders(token);
      setAvailableDriveFolders(folders);
    } catch (e) {
      console.warn('Erro ao carregar pastas:', e);
    } finally {
      setIsLoadingDriveFolders(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setIsDriveConnecting(true);
    try {
      const res = await loginWithGoogle();
      if (res?.cancelled) {
        onShowToast('Janela de login Google fechada. Para conectar ao Drive, clique novamente e autorize a conta.', 'info');
        return;
      }
      if (res && res.user) {
        setGoogleUser(res.user);
        if (res.accessToken) {
          setDriveToken(res.accessToken);
          setCachedDriveAccessToken(res.accessToken);
          loadDriveFolders(res.accessToken);
          fetchFolderMetadata(res.accessToken);
          checkTokenValidity(res.accessToken);
        }

        const updated = { ...config, saveToDrive: true };
        setConfig(updated);
        DriveAndFolderService.saveConfig(updated, currentUser?.id);

        // Save individualized Google account for this user
        DriveAndFolderService.saveGoogleAccount({
          userId: currentUser?.id || 'default',
          email: res.user?.email || '',
          displayName: res.user?.displayName || undefined,
          photoUrl: res.user?.photoURL || undefined,
          accessToken: res.accessToken || undefined,
          connectedAt: new Date().toISOString()
        }, currentUser?.id);

        onShowToast(`Conectado ao Google Drive com a conta ${res.user?.email || 'Google'} (individual para ${currentUser?.nome || 'você'})!`, 'success');
      } else {
        onShowToast('Conta conectada com sucesso ao Google Drive.', 'success');
      }
    } catch (err: any) {
      console.error('Falha login Drive:', err);
      if (err?.code === 'auth/unauthorized-domain' || String(err?.message).includes('unauthorized-domain')) {
        setShowNetlifyGuide(true);
        onShowToast(`Domínio do Netlify não autorizado no Firebase. Veja o passo a passo abaixo para liberar ou conecte via Google Identity (GSI)!`, 'info');
      } else if (err?.code === 'auth/popup-closed-by-user' || String(err?.message).includes('popup-closed-by-user')) {
        onShowToast('A janela de login foi fechada antes de concluir.', 'info');
      } else {
        onShowToast(err.message || 'Erro ao conectar conta Google.', 'error');
      }
    } finally {
      setIsDriveConnecting(false);
    }
  };

  const handleConnectGSI = async () => {
    setIsDriveConnecting(true);
    try {
      const res = await DriveAndFolderService.requestGoogleDriveTokenGSI();
      if (res && res.accessToken) {
        setDriveToken(res.accessToken);
        setCachedDriveAccessToken(res.accessToken);
        loadDriveFolders(res.accessToken);
        fetchFolderMetadata(res.accessToken);

        const val = await DriveAndFolderService.validateDriveAccessToken(res.accessToken);
        const email = val.email || currentUser?.email || 'larifreitaseng@gmail.com';
        const name = val.displayName || currentUser?.nome || 'Engenharia';

        DriveAndFolderService.saveGoogleAccount({
          userId: currentUser?.id || 'default',
          email,
          displayName: name,
          accessToken: res.accessToken,
          connectedAt: new Date().toISOString()
        }, currentUser?.id);

        setGoogleUser({ email, displayName: name });
        const updated = { ...config, saveToDrive: true };
        setConfig(updated);
        DriveAndFolderService.saveConfig(updated, currentUser?.id);
        setTokenStatus({ checking: false, valid: true, email });
        onShowToast(`Google Drive conectado via Google Identity (${email})! Pronto para salvar PDFs e fotos.`, 'success');
      }
    } catch (e: any) {
      console.warn('GSI Auth error:', e);
      onShowToast(e.message || 'Erro ao conectar via Google Identity.', 'error');
    } finally {
      setIsDriveConnecting(false);
    }
  };

  const handleSaveManualToken = async () => {
    if (!manualToken.trim()) {
      onShowToast('Cole um token de acesso válido do Google OAuth.', 'error');
      return;
    }
    const cleanToken = manualToken.trim();
    setTokenStatus({ checking: true });
    try {
      const val = await DriveAndFolderService.validateDriveAccessToken(cleanToken);
      if (val.valid) {
        setDriveToken(cleanToken);
        setCachedDriveAccessToken(cleanToken);
        loadDriveFolders(cleanToken);
        fetchFolderMetadata(cleanToken);

        const email = val.email || currentUser?.email || 'larifreitaseng@gmail.com';
        const name = val.displayName || currentUser?.nome || 'Engenharia';

        DriveAndFolderService.saveGoogleAccount({
          userId: currentUser?.id || 'default',
          email,
          displayName: name,
          accessToken: cleanToken,
          connectedAt: new Date().toISOString()
        }, currentUser?.id);

        setGoogleUser({ email, displayName: name });
        const updated = { ...config, saveToDrive: true };
        setConfig(updated);
        DriveAndFolderService.saveConfig(updated, currentUser?.id);
        setTokenStatus({ checking: false, valid: true, email });
        setShowManualTokenInput(false);
        setManualToken('');
        onShowToast(`Token validado com sucesso para ${email}! Salva de PDFs e fotos liberada.`, 'success');
      } else {
        setTokenStatus({ checking: false, valid: false, error: val.error });
        onShowToast(`Token inválido: ${val.error}`, 'error');
      }
    } catch (e: any) {
      setTokenStatus({ checking: false, valid: false, error: e.message });
      onShowToast(`Erro ao testar token: ${e.message}`, 'error');
    }
  };

  const handleCopyDomain = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname);
    setIsCopiedDomain(true);
    onShowToast(`Domínio "${currentHostname}" copiado para a área de transferência!`, 'success');
    setTimeout(() => setIsCopiedDomain(false), 3000);
  };

  const handleQuickLinkGoogleAccount = (customEmail?: string) => {
    const targetEmail = customEmail || currentUser?.email || 'larifreitaseng@gmail.com';
    const targetName = currentUser?.nome || 'Engenharia';

    DriveAndFolderService.saveGoogleAccount({
      userId: currentUser?.id || 'default',
      email: targetEmail,
      displayName: targetName,
      connectedAt: new Date().toISOString()
    }, currentUser?.id);

    setGoogleUser({
      email: targetEmail,
      displayName: targetName
    });

    const updated = {
      ...config,
      saveToDrive: true,
      driveFolderId: config.driveFolderId || LINKED_DRIVE_FOLDER_ID,
      driveFolderName: config.driveFolderName || '01 - PASTA_GERAL_OBRAS',
      driveFolderPath: config.driveFolderPath || 'Google Drive > 01 - PASTA_GERAL_OBRAS'
    };
    setConfig(updated);
    DriveAndFolderService.saveConfig(updated, currentUser?.id);

    onShowToast(`Conta Google (${targetEmail}) vinculada ao Google Drive com sucesso!`, 'success');
  };

  const handleDisconnectGoogleDrive = () => {
    DriveAndFolderService.clearGoogleAccount(currentUser?.id);
    setDriveToken(null);
    setCachedDriveAccessToken(null);
    setGoogleUser(null);
    setTokenStatus({ checking: false, valid: false });
    const updated = { ...config, saveToDrive: false };
    setConfig(updated);
    DriveAndFolderService.saveConfig(updated, currentUser?.id);
    onShowToast(`Conta Google desvinculada para o usuário ${currentUser?.nome || 'atual'}.`, 'info');
  };

  const handleSelectDriveFolder = (folderConfig: {
    folderId?: string;
    folderName: string;
    folderPath?: string;
    pdfSubfolder?: string;
    photosSubfolder?: string;
    organizeByObra?: boolean;
  }) => {
    const updated = DriveAndFolderService.applyDriveFolderSelection(
      folderConfig.folderId,
      folderConfig.folderName,
      folderConfig.folderPath,
      folderConfig.pdfSubfolder,
      folderConfig.photosSubfolder,
      folderConfig.organizeByObra,
      currentUser?.id
    );
    setConfig(updated);
    onShowToast(`Pasta de destino no Drive configurada: "${folderConfig.folderName}"!`, 'success');
  };

  const handleUseLinkedDriveFolder = async () => {
    const targetId = LINKED_DRIVE_FOLDER_ID;
    let folderName = 'Pasta Vinculada do Drive';
    let folderPath = 'Google Drive > Pasta Vinculada';
    if (driveToken) {
      try {
        const details = await DriveAndFolderService.getDriveFolderDetails(targetId, driveToken);
        if (details?.name) {
          folderName = details.name;
          folderPath = `Google Drive > ${details.name}`;
        }
      } catch (e) {
        console.warn('Erro ao carregar nome da pasta:', e);
      }
    }
    const updated = DriveAndFolderService.applyDriveFolderSelection(
      targetId,
      folderName,
      folderPath,
      config.drivePdfSubfolder,
      config.drivePhotosSubfolder,
      config.driveOrganizeByObra,
      currentUser?.id
    );
    setConfig(updated);
    onShowToast(`Pasta vinculada ativada com sucesso! (${targetId})`, 'success');
  };

  const handleResetDriveFolder = () => {
    const updated = DriveAndFolderService.applyDriveFolderSelection(
      undefined,
      'Diários de Obra - RDO',
      'Meu Drive > Diários de Obra - RDO',
      config.drivePdfSubfolder,
      config.drivePhotosSubfolder,
      config.driveOrganizeByObra,
      currentUser?.id
    );
    setConfig(updated);
    onShowToast('Pasta de destino redefinida para "Diários de Obra - RDO" na raiz do Drive.', 'info');
  };

  const handleSaveConfig = () => {
    DriveAndFolderService.saveConfig(config, currentUser?.id);
    onShowToast(`Configurações salvas com sucesso para ${currentUser?.nome || 'o usuário'}!`, 'success');
  };

  // Sync / Export all filtered RDOs to Google Drive
  const handleExportToDrive = async () => {
    const targetRdos = selectedObraId === 'todas' 
      ? rdos 
      : rdos.filter(r => r.obraId === selectedObraId);

    if (targetRdos.length === 0) {
      onShowToast('Nenhum RDO encontrado para o filtro selecionado.', 'info');
      return;
    }

    let token = driveToken || getCachedDriveAccessToken();
    if (!token) {
      onShowToast('Conecte sua conta do Google Drive primeiro.', 'error');
      await handleConnectGoogleDrive();
      token = getCachedDriveAccessToken();
      if (!token) return;
    }

      setIsExporting(true);
      setExportProgress(`Criando estrutura de pastas no Google Drive...`);

      try {
        const pdfFolderCustom = config.drivePdfSubfolder?.trim() || 'Relatórios em PDF';
        const photoFolderCustom = config.drivePhotosSubfolder?.trim() || 'Acervo Fotográfico';

        const rootFolderId = await DriveAndFolderService.resolveDriveTargetFolder(
          config,
          token
        );

        let countSuccess = 0;
        let photosUploaded = 0;

        for (let i = 0; i < targetRdos.length; i++) {
          const rdo = targetRdos[i];
          const obra = obras.find(o => o.id === rdo.obraId);
          const obraName = obra?.nome || 'Obra Sem Nome';

          setExportProgress(`Enviando RDO ${i + 1} de ${targetRdos.length} (${obraName})...`);

          // Nest by Obra if configured
          let baseParentId = rootFolderId;
          if (config.driveOrganizeByObra !== false) {
            baseParentId = await DriveAndFolderService.getOrCreateDriveFolder(
              obraName,
              token,
              rootFolderId
            );
          }

          const pdfsFolderId = await DriveAndFolderService.getOrCreateDriveFolder(
            pdfFolderCustom,
            token,
            baseParentId
          );

          const fotosFolderId = await DriveAndFolderService.getOrCreateDriveFolder(
            photoFolderCustom,
            token,
            baseParentId
          );

          const { blob, fileName } = await obterPdfBlob(rdo, obra);
          const uploadRes = await DriveAndFolderService.uploadFileToDrive(
            fileName,
            'application/pdf',
            blob,
            token,
            pdfsFolderId
          );

          if (uploadRes.webViewLink) {
            setLastUploadedLink(uploadRes.webViewLink);
          }
          countSuccess++;

          if (rdo.fotos && rdo.fotos.length > 0) {
            for (let f = 0; f < rdo.fotos.length; f++) {
              const foto = rdo.fotos[f];
              if (foto.url && foto.url.startsWith('data:image')) {
                try {
                  const fotoBlob = DriveAndFolderService.dataUrlToBlob(foto.url);
                  const fotoName = `Foto_RDO_${String(rdo.numero).padStart(3, '0')}_${f + 1}.jpg`;
                  await DriveAndFolderService.uploadFileToDrive(
                    fotoName,
                    'image/jpeg',
                    fotoBlob,
                    token,
                    fotosFolderId
                  );
                  photosUploaded++;
                } catch (e) {
                  console.warn('Erro ao subir foto:', e);
                }
              }
            }
          }
        }

        onShowToast(`Exportação concluída no Google Drive! ${countSuccess} PDFs na pasta "${pdfFolderCustom}" e ${photosUploaded} fotos na pasta "${photoFolderCustom}".`, 'success');
      } catch (err: any) {
        console.error('Erro na exportação Drive:', err);
        onShowToast(`Falha no envio ao Drive: ${err.message || err}`, 'error');
      } finally {
        setIsExporting(false);
        setExportProgress('');
      }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs tracking-wider uppercase">
              <FolderSync className="w-4 h-4" />
              <span>Gerenciamento de Pastas e Armazenamento</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Destino dos Relatórios em PDF e Fotos
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Defina o nome ou escolha as pastas no <strong>Google Drive</strong> para salvar automaticamente os <strong>PDFs diários</strong> e as <strong>fotos anexadas</strong>, mantendo os relatórios sincronizados em tempo real no <strong>Firebase</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Diretórios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assistente de Domínio para Netlify & GitHub Pages */}
      {(showNetlifyGuide || isNetlifyOrCustom) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Configuração de Domínio para Netlify & GitHub</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Endereço detectado: <code className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900 font-mono text-xs">{currentHostname || 'seu-site.netlify.app'}</code>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                O Google exige que o endereço do Netlify/GitHub esteja autorizado para permitir a geração da chave de acesso ao Google Drive (evitando o erro <em>auth/unauthorized-domain</em>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyDomain}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Copiar domínio para colar no Firebase"
              >
                {isCopiedDomain ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Domínio Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar Domínio</span>
                  </>
                )}
              </button>

              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0431169862/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <span>Abrir Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-700">
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
              <strong className="text-amber-900 block font-bold">1. Copie o endereço</strong>
              Clique no botão <strong>Copiar Domínio</strong> acima.
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
              <strong className="text-amber-900 block font-bold">2. Cole no Firebase</strong>
              Vá em <em>Configurações &gt; Domínios autorizados &gt; Adicionar domínio</em> e salve.
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
              <strong className="text-amber-900 block font-bold">3. Conecte com 1 clique</strong>
              Clique em <strong>Conectar Google</strong> ou use o botão <strong>Google Identity (GSI)</strong> logo abaixo.
            </div>
          </div>
        </div>
      )}

      {/* Storage Providers Grid (Firebase and Google Drive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. FIREBASE (Nuvem em Tempo Real) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                PADRÃO ATIVO
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">Firebase Firestore</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Armazena dados completos, equipes, apontamentos e fotos em tempo real na nuvem do Google Cloud.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Sincronização instantânea multiusuário</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Preserva dados entre abas e dispositivos</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Base de dados ativa do projeto</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">
              Conexão gerenciada automaticamente.
            </span>
          </div>
        </div>

        {/* 2. GOOGLE DRIVE (Customização de Pastas de PDF e Fotos) */}
        <div className={`bg-white rounded-2xl p-6 border shadow-xs flex flex-col justify-between relative overflow-hidden ${
          config.saveToDrive ? 'border-amber-400/80 ring-1 ring-amber-400/30' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              {googleUser ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-700" />
                  CONECTADO
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                  DISPONÍVEL
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900">Google Drive</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Armazene os relatórios e fotos em pastas customizadas no Google Drive.
            </p>

            {googleUser ? (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-medium text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Conta Google Vinculada:</span>
                    <span className="truncate font-bold text-slate-800">{googleUser.email || googleUser.displayName}</span>
                    {currentUser && (
                      <span className="text-[10px] text-amber-700 block">
                        Vinculado a: <strong>{currentUser.nome}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => checkTokenValidity(driveToken)}
                      disabled={tokenStatus.checking}
                      className="text-[10px] text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Testar se o token do Google Drive ainda está válido"
                    >
                      <RefreshCw className={`w-3 h-3 ${tokenStatus.checking ? 'animate-spin' : ''}`} />
                      <span>{tokenStatus.checking ? 'Testando...' : 'Testar Token'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogleDrive}
                      title="Desconectar conta Google para este usuário"
                      className="text-[10px] text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>

                {/* Token Health Status */}
                {tokenStatus.valid ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Chave de Acesso do Drive Ativa. Pronto para salvar PDFs e Fotos!</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Autorização de Envio Pendente</strong>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Para que o aplicativo possa criar pastas e enviar os relatórios em PDF e as fotos diretamente para o seu Google Drive, autorize a conexão com uma das opções:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConnectGoogleDrive}
                        disabled={isDriveConnecting}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Conectar via Google (Popup)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConnectGSI}
                        disabled={isDriveConnecting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                        title="Conectar diretamente via Google Identity Services"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Conectar via Google Identity (GSI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <span>Token Manual</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <span className="text-slate-800 font-bold block">Conectar Conta Google para Salvar Arquivos:</span>
                  <span className="text-[11px] text-slate-500">
                    Escolha o método mais conveniente para autorizar o salvamento automático de PDFs e fotos no seu Drive.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    disabled={isDriveConnecting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isDriveConnecting ? 'Conectando...' : 'Conectar Google (Popup)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectGSI}
                    disabled={isDriveConnecting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Conectar via Google (GSI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLinkGoogleAccount(currentUser?.email || 'larifreitaseng@gmail.com')}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vincular Conta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inserir Token</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Token Collapsible Box */}
            {showManualTokenInput && (
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Inserir Chave de Acesso do Google Drive (OAuth Bearer Token):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualTokenInput(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Cole aqui o token ya29...."
                    className="flex-1 text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualToken}
                    disabled={tokenStatus.checking}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    {tokenStatus.checking ? 'Testando...' : 'Salvar e Validar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Ideal caso seu domínio do Netlify ainda não esteja autorizado no Firebase. Permite envio direto de PDFs e imagens para o Google Drive.
                </p>
              </div>
            )}

            {/* Folder selection fields */}
            <div className="mt-4 space-y-3">
              
              {/* Card da Pasta Selecionada no Drive */}
              <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                    Pasta de Destino no Drive:
                  </span>
                  {(config.driveFolderId || LINKED_DRIVE_FOLDER_ID) && (
                    <a
                      href={`https://drive.google.com/drive/folders/${config.driveFolderId || LINKED_DRIVE_FOLDER_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Abrir no Drive</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-400/20 shrink-0" />
                      <span className="truncate">{config.driveFolderName || 'Pasta Vinculada do Drive'}</span>
                    </p>
                    {config.driveFolderId === LINKED_DRIVE_FOLDER_ID && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Vinculada
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {config.driveFolderPath || `Google Drive > ${config.driveFolderName || 'Pasta Vinculada'}`}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400">
                    ID: {config.driveFolderId || LINKED_DRIVE_FOLDER_ID}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleUser) {
                        handleConnectGoogleDrive();
                      } else {
                        setIsDriveFolderModalOpen(true);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Escolher / Trocar Pasta</span>
                  </button>
                  {config.driveFolderId !== LINKED_DRIVE_FOLDER_ID && (
                    <button
                      type="button"
                      onClick={handleUseLinkedDriveFolder}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 rounded-lg transition-colors"
                      title="Restaurar a pasta fornecida no link do Drive"
                    >
                      Usar Vinculada
                    </button>
                  )}
                  {config.driveFolderId && (
                    <button
                      type="button"
                      onClick={handleResetDriveFolder}
                      className="px-2 py-1.5 text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:bg-amber-100/60 rounded-lg transition-colors"
                      title="Restaurar pasta padrão na raiz do Drive"
                    >
                      Padrão
                    </button>
                  )}
                </div>
              </div>

              {/* Pasta de PDFs no Drive */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Subpasta para Relatórios (PDF):</span>
                </label>
                <input
                  type="text"
                  value={config.drivePdfSubfolder || ''}
                  onChange={(e) => setConfig({ ...config, drivePdfSubfolder: e.target.value })}
                  placeholder="Ex: Relatórios em PDF"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Pasta de Fotos no Drive */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Subpasta para Fotos / Imagens:</span>
                </label>
                <input
                  type="text"
                  value={config.drivePhotosSubfolder || ''}
                  onChange={(e) => setConfig({ ...config, drivePhotosSubfolder: e.target.value })}
                  placeholder="Ex: Acervo Fotográfico"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Subdividir por Obra */}
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={config.driveOrganizeByObra !== false}
                  onChange={(e) => setConfig({ ...config, driveOrganizeByObra: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span>Criar subpasta com o nome de cada Obra</span>
              </label>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            {!googleUser ? (
              <button
                onClick={handleConnectGoogleDrive}
                disabled={isDriveConnecting}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
              >
                {isDriveConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Conectar Google Drive</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={config.saveToDrive}
                    onChange={(e) => {
                      const updated = { ...config, saveToDrive: e.target.checked };
                      setConfig(updated);
                      DriveAndFolderService.saveConfig(updated);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Habilitar envio ao Drive</span>
                </label>
                <button
                  onClick={handleConnectGoogleDrive}
                  className="text-[11px] font-semibold text-amber-700 hover:underline"
                >
                  Trocar Conta
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Manual Sync / Bulk Export Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-amber-500" />
              <span>Central de Exportação e Sincronização em Massa</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Arquive de uma vez os PDFs em <strong>"{config.drivePdfSubfolder || 'Relatórios em PDF'}"</strong> e as imagens em <strong>"{config.drivePhotosSubfolder || 'Acervo Fotográfico'}"</strong>.
            </p>
          </div>

          {/* Obra Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Filtrar Obra:
            </label>
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todas">Todas as Obras ({rdos.length} RDOs)</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} ({rdos.filter(r => r.obraId === o.id).length} RDOs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress indicator */}
        {isExporting && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
            <div className="text-xs font-semibold text-amber-900">
              {exportProgress}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Exportar Acervo para o Google Drive</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Organiza no Drive os PDFs na pasta <strong>"{config.drivePdfSubfolder || 'Relatórios em PDF'}"</strong> e as fotos na pasta <strong>"{config.drivePhotosSubfolder || 'Acervo Fotográfico'}"</strong>.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={handleExportToDrive}
                disabled={isExporting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Sincronizar no Google Drive</span>
              </button>
            </div>
          </div>
        </div>

        {lastUploadedLink && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span className="font-medium">Arquivos sincronizados com sucesso no Google Drive!</span>
            <a
              href={lastUploadedLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-bold underline hover:text-emerald-950"
            >
              <span>Abrir no Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

      </div>

      {/* Structure Preview Guide */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Shield className="w-5 h-5" />
            <span>Estrutura de Arquivamento Configurada</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Sempre que um RDO diário for emitido ou sincronizado, o sistema organiza os arquivos no seguinte padrão pericial:
          </p>
          <div className="p-3 bg-slate-950/70 rounded-xl font-mono text-[11px] text-amber-300/90 border border-slate-800 space-y-1">
            <div>📁 {config.driveFolderName || 'Diários de Obra - RDO'} (Google Drive)</div>
            <div className="pl-4">↳ 📁 [Nome da Obra]</div>
            <div className="pl-8 text-amber-300">↳ 📁 {config.drivePdfSubfolder || 'Relatórios em PDF'} (RDO_Obra_N001_Data.pdf)</div>
            <div className="pl-8 text-emerald-300">↳ 📁 {config.drivePhotosSubfolder || 'Acervo Fotográfico'} (Foto_RDO_001_1.jpg, Foto_001_2.jpg...)</div>
          </div>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2 max-w-sm shrink-0">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Salvamento em Tempo Real</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ao salvar um RDO no formulário de campo, os dados são gravados no Firebase e uma cópia dos PDFs e fotos anexadas é enviada diretamente ao Google Drive.
          </p>
        </div>
      </div>

      {/* MODAL PARA ESCOLHER PASTA ESPECÍFICA NO GOOGLE DRIVE */}
      <DriveFolderPickerModal
        isOpen={isDriveFolderModalOpen}
        onClose={() => setIsDriveFolderModalOpen(false)}
        onSelectFolder={handleSelectDriveFolder}
        initialFolderId={config.driveFolderId || LINKED_DRIVE_FOLDER_ID}
        initialFolderName={config.driveFolderName}
        initialPdfSubfolder={config.drivePdfSubfolder}
        initialPhotosSubfolder={config.drivePhotosSubfolder}
        initialOrganizeByObra={config.driveOrganizeByObra}
        onShowToast={onShowToast}
      />

    </div>
  );
};
