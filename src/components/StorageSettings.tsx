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
  X
} from 'lucide-react';
import { Obra, RelatorioDiarioObra } from '../types';
import { 
  DriveAndFolderService, 
  StorageConfig, 
  DriveFolderItem,
  LINKED_DRIVE_FOLDER_ID,
  LINKED_DRIVE_FOLDER_URL
} from '../services/driveAndFolderService';
import { loginWithGoogle, getCachedDriveAccessToken, auth } from '../firebase';
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

  // Re-sync configuration and Google account when currentUser changes
  useEffect(() => {
    const userCfg = DriveAndFolderService.getConfig(currentUser?.id);
    setConfig(userCfg);
    const userGoogle = DriveAndFolderService.getGoogleAccount(currentUser?.id);
    if (userGoogle) {
      if (userGoogle.accessToken) {
        setDriveToken(userGoogle.accessToken);
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
          loadDriveFolders(res.accessToken);
          fetchFolderMetadata(res.accessToken);
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
        onShowToast(`Domínio do Netlify não autorizado no Firebase. Vinculando conta Google de ${currentUser?.nome || 'Larissa'} diretamente...`, 'info');
        handleQuickLinkGoogleAccount(currentUser?.email || 'larifreitaseng@gmail.com');
      } else if (err?.code === 'auth/popup-closed-by-user' || String(err?.message).includes('popup-closed-by-user')) {
        onShowToast('A janela de login foi fechada antes de concluir.', 'info');
      } else {
        onShowToast(err.message || 'Erro ao conectar conta Google.', 'error');
      }
    } finally {
      setIsDriveConnecting(false);
    }
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
    setGoogleUser(null);
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
              <div className="mt-3 text-[11px] font-medium text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                  <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded font-semibold">Individual</span>
                  <button
                    type="button"
                    onClick={handleDisconnectGoogleDrive}
                    title="Desconectar conta Google para este usuário"
                    className="text-[10px] text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-semibold transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-700 font-medium block">Nenhuma conta Google conectada para este usuário.</span>
                  <span className="text-[11px] text-slate-400">Você pode autorizar pelo popup ou vincular diretamente seu e-mail.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickLinkGoogleAccount(currentUser?.email || 'larifreitaseng@gmail.com')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vincular Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    disabled={isDriveConnecting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    {isDriveConnecting ? 'Conectando...' : 'Conectar Google'}
                  </button>
                </div>
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

function FolderSync(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2"/>
      <path d="M12 14v6"/>
      <path d="M15 17h-6"/>
      <path d="M19 14l3 3-3 3"/>
      <path d="M22 17h-6"/>
    </svg>
  );
}
