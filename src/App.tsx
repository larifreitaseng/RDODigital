import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ObrasList } from './components/ObrasList';
import { ObraModal } from './components/ObraModal';
import { ColaboradoresView } from './components/ColaboradoresView';
import { EquipamentosView } from './components/EquipamentosView';
import { RdoList } from './components/RdoList';
import { RdoViewModal } from './components/RdoViewModal';
import { RdoFormModal } from './components/RdoFormModal';
import { PeriodosView } from './components/PeriodosView';
import { UsuariosView } from './components/UsuariosView';
import { UsuarioModal } from './components/UsuarioModal';
import { StorageSettings } from './components/StorageSettings';
import { LoginView } from './components/LoginView';
import { LogoutView } from './components/LogoutView';
import { StorageService } from './services/storageService';
import { FirebaseService } from './services/firebaseService';
import { DriveAndFolderService } from './services/driveAndFolderService';
import { testConnection, getCachedDriveAccessToken } from './firebase';
import { baixarPdfRdo, compartilharRdo, obterPdfBlob } from './services/pdfService';
import { Obra, Colaborador, Equipamento, RelatorioDiarioObra, UsuarioEquipe } from './types';
import { CheckCircle2, AlertCircle, FileCheck, HardHat, Eye, ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // Data State
  const [obras, setObras] = useState<Obra[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [rdos, setRdos] = useState<RelatorioDiarioObra[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioEquipe[]>([]);
  const [currentUser, setCurrentUser] = useState<UsuarioEquipe | null>(null);

  // Modals e Selection State
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  const [isRdoFormOpen, setIsRdoFormOpen] = useState(false);
  const [editingRdo, setEditingRdo] = useState<RelatorioDiarioObra | null>(null);
  const [formInitialObraId, setFormInitialObraId] = useState<string | undefined>(undefined);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);

  const [isRdoViewOpen, setIsRdoViewOpen] = useState(false);
  const [viewingRdo, setViewingRdo] = useState<RelatorioDiarioObra | null>(null);

  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioEquipe | null>(null);

  // Filter for RDO List when navigating from obra
  const [rdoObraFilter, setRdoObraFilter] = useState<string>('todas');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load from Storage
  const loadData = () => {
    setObras(StorageService.getObras());
    setColaboradores(StorageService.getColaboradores());
    setEquipamentos(StorageService.getEquipamentos());
    setRdos(StorageService.getRdos());
    setUsuarios(StorageService.getUsuarios());
    setCurrentUser(StorageService.getCurrentUser());
  };

  useEffect(() => {
    // Immediate render from local cache
    loadData();

    // Initialize permanent IndexedDB storage to guarantee reports are never lost
    StorageService.initAsyncStorage((loadedRdos) => {
      if (loadedRdos && loadedRdos.length > 0) {
        setRdos(loadedRdos);
      }
    });

    // Verify Firestore connection
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    }).catch(() => {
      setIsFirebaseConnected(false);
    });

    // Seed default data to Firestore if cloud database is empty
    FirebaseService.seedInitialDataIfEmpty().catch((err) => {
      console.warn('Firebase seed info:', err);
    });

    // Real-time synchronization across all collections
    const unsubscribe = FirebaseService.subscribeAll({
      onObras: (firestoreObras) => {
        if (firestoreObras && firestoreObras.length > 0) {
          setObras(firestoreObras);
          StorageService.setObrasLocal(firestoreObras);
        }
      },
      onRdos: (firestoreRdos) => {
        if (firestoreRdos && firestoreRdos.length > 0) {
          const merged = StorageService.setRdosLocal(firestoreRdos);
          setRdos(merged);
        }
      },
      onColaboradores: (firestoreColabs) => {
        if (firestoreColabs && firestoreColabs.length > 0) {
          setColaboradores(firestoreColabs);
          StorageService.setColaboradoresLocal(firestoreColabs);
        }
      },
      onEquipamentos: (firestoreEqs) => {
        if (firestoreEqs && firestoreEqs.length > 0) {
          setEquipamentos(firestoreEqs);
          StorageService.setEquipamentosLocal(firestoreEqs);
        }
      },
      onUsuarios: (firestoreUsers) => {
        if (firestoreUsers && firestoreUsers.length > 0) {
          setUsuarios(firestoreUsers);
          StorageService.setUsuariosLocal(firestoreUsers);
        }
      },
      onReady: () => {
        setIsFirebaseConnected(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isViewer = !currentUser || currentUser?.perfil === 'visualizador';

  // OBRAS HANDLERS
  const handleSaveObra = (obra: Obra) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Identifique-se com um login autorizado para cadastrar ou alterar obras.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Usuários com perfil "Visualizador" não têm permissão para cadastrar ou alterar obras.', 'error');
      }
      return;
    }
    StorageService.saveObra(obra);
    FirebaseService.saveObra(obra).catch(console.error);
    loadData();
    showToast(`Obra "${obra.nome}" salva com sucesso! Sincronizado no Firebase.`);
  };

  const handleDeleteObra = (id: string) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Identifique-se com um login autorizado para excluir obras.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Usuários com perfil "Visualizador" não podem excluir obras.', 'error');
      }
      return;
    }
    StorageService.deleteObra(id);
    FirebaseService.deleteObra(id).catch(console.error);
    loadData();
    showToast('Obra excluída com sucesso!', 'info');
  };

  // COLABORADORES HANDLERS
  const handleSaveColaborador = (colaborador: Colaborador) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Faça login com permissão de editor para cadastrar colaboradores.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Perfil "Visualizador" não pode alterar o quadro de colaboradores.', 'error');
      }
      return;
    }
    StorageService.saveColaborador(colaborador);
    FirebaseService.saveColaborador(colaborador).catch(console.error);
    loadData();
    showToast(`Colaborador "${colaborador.nome}" salvo!`);
  };

  const handleDeleteColaborador = (id: string) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Faça login com permissão de editor para remover colaboradores.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Perfil "Visualizador" não pode excluir colaboradores.', 'error');
      }
      return;
    }
    StorageService.deleteColaborador(id);
    FirebaseService.deleteColaborador(id).catch(console.error);
    loadData();
    showToast('Colaborador removido.', 'info');
  };

  // EQUIPAMENTOS HANDLERS
  const handleSaveEquipamento = (equipamento: Equipamento) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Faça login para cadastrar equipamentos.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Perfil "Visualizador" não pode alterar a frota de equipamentos.', 'error');
      }
      return;
    }
    StorageService.saveEquipamento(equipamento);
    FirebaseService.saveEquipamento(equipamento).catch(console.error);
    loadData();
    showToast(`Equipamento "${equipamento.nome}" salvo!`);
  };

  const handleDeleteEquipamento = (id: string) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Faça login para remover equipamentos.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Perfil "Visualizador" não possui permissão de exclusão.', 'error');
      }
      return;
    }
    StorageService.deleteEquipamento(id);
    FirebaseService.deleteEquipamento(id).catch(console.error);
    loadData();
    showToast('Equipamento removido.', 'info');
  };

  // RDOS HANDLERS
  const handleSaveRdo = (rdo: RelatorioDiarioObra) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Faça login com uma conta de editor para salvar o RDO.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Usuários com perfil "Visualizador" não podem modificar o RDO.', 'error');
      }
      return;
    }
    // 1. Immediately save to persistent storage (Memory + IndexedDB + LocalStorage)
    StorageService.saveRdo(rdo);
    loadData();

    // 2. Cloud sync to Firebase
    FirebaseService.saveRdo(rdo).catch((err) => {
      console.warn('Sincronização em nuvem do Firebase em segundo plano/offline:', err);
    });

    // 3. Auto-save copies to Google Drive if enabled
    const storageCfg = DriveAndFolderService.getConfig(currentUser?.id);
    const obra = obras.find(o => o.id === rdo.obraId);
    const obraName = obra?.nome || 'Obra';

    if (storageCfg.saveToDrive) {
      const userGoogle = currentUser ? DriveAndFolderService.getGoogleAccount(currentUser.id) : null;
      const driveToken = userGoogle?.accessToken || getCachedDriveAccessToken();

      if (driveToken) {
        showToast(`RDO Nº ${String(rdo.numero).padStart(3, '0')} salvo no app! Enviando ao Google Drive...`, 'info');
        (async () => {
          try {
            const pdfSubfolder = storageCfg.drivePdfSubfolder?.trim() || 'Relatórios em PDF';
            const photoSubfolder = storageCfg.drivePhotosSubfolder?.trim() || 'Acervo Fotográfico';

            const rootFolderId = await DriveAndFolderService.resolveDriveTargetFolder(storageCfg, driveToken);
            
            let baseFolderId = rootFolderId;
            if (storageCfg.driveOrganizeByObra !== false) {
              baseFolderId = await DriveAndFolderService.getOrCreateDriveFolder(obraName, driveToken, rootFolderId);
            }

            // 1. Save PDF
            if (storageCfg.autoSavePdfOnEmit !== false) {
              const { blob, fileName } = await obterPdfBlob(rdo, obra);
              const pdfsFolderId = await DriveAndFolderService.getOrCreateDriveFolder(pdfSubfolder, driveToken, baseFolderId);
              await DriveAndFolderService.uploadFileToDrive(fileName, 'application/pdf', blob, driveToken, pdfsFolderId);
            }

            // 2. Save Attached Photos
            if (storageCfg.autoSavePhotosOnEmit !== false && rdo.fotos && rdo.fotos.length > 0) {
              const fotosFolderId = await DriveAndFolderService.getOrCreateDriveFolder(photoSubfolder, driveToken, baseFolderId);
              for (let f = 0; f < rdo.fotos.length; f++) {
                const foto = rdo.fotos[f];
                if (foto.url && foto.url.startsWith('data:image')) {
                  try {
                    const fotoBlob = DriveAndFolderService.dataUrlToBlob(foto.url);
                    const fotoName = `Foto_RDO_${String(rdo.numero).padStart(3, '0')}_${f + 1}.jpg`;
                    await DriveAndFolderService.uploadFileToDrive(fotoName, 'image/jpeg', fotoBlob, driveToken, fotosFolderId);
                  } catch (errFoto) {
                    console.warn('Erro ao salvar foto individual no Drive:', errFoto);
                  }
                }
              }
            }

            showToast(`RDO Nº ${String(rdo.numero).padStart(3, '0')} salvo no app e sincronizado no Google Drive!`, 'success');
          } catch (e: any) {
            console.warn('Auto-save to Drive error:', e);
            showToast(`RDO Nº ${String(rdo.numero).padStart(3, '0')} guardado no app com sucesso! (Aviso: para enviar ao Drive, reconecte sua conta do Google nas Configurações).`, 'info');
          }
        })();
      } else {
        showToast(`RDO Nº ${String(rdo.numero).padStart(3, '0')} salvo com sucesso e guardado no app! (Para sincronizar cópia no Google Drive, conecte sua conta nas Configurações).`, 'info');
      }
    } else {
      showToast(`RDO Nº ${String(rdo.numero).padStart(3, '0')} salvo com sucesso e disponível no aplicativo!`, 'success');
    }
  };

  const handleConfirmLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleDeleteRdo = (id: string) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Identifique-se com um login autorizado para excluir relatórios.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Usuários com perfil "Visualizador" não podem excluir relatórios.', 'error');
      }
      return;
    }
    StorageService.deleteRdo(id);
    FirebaseService.deleteRdo(id).catch(console.error);
    loadData();
    showToast('Relatório Diário excluído.', 'info');
  };

  // USUÁRIOS E LOGINS HANDLERS
  const handleSaveUsuario = (user: UsuarioEquipe) => {
    if (isViewer) {
      showToast('Acesso Restrito: Apenas administradores/editores autorizados podem cadastrar ou alterar logins.', 'error');
      return;
    }
    StorageService.saveUsuario(user);
    FirebaseService.saveUsuario(user).catch(console.error);
    loadData();
    showToast(`Login de "${user.nome}" (${user.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'}) salvo! Sincronizado no Firebase.`);
  };

  const handleDeleteUsuario = (id: string) => {
    if (isViewer) {
      showToast('Acesso Restrito: Usuários em modo visitante ou visualizadores não podem excluir logins.', 'error');
      return;
    }
    StorageService.deleteUsuario(id);
    FirebaseService.deleteUsuario(id).catch(console.error);
    loadData();
    showToast('Login de acesso removido do sistema.', 'info');
  };

  const handleToggleStatusUsuario = (user: UsuarioEquipe) => {
    if (isViewer) {
      showToast('Acesso Restrito: Usuários em modo visitante ou visualizadores não podem alterar status de logins.', 'error');
      return;
    }
    const updated = { ...user, ativo: !user.ativo };
    StorageService.saveUsuario(updated);
    FirebaseService.saveUsuario(updated).catch(console.error);
    loadData();
    showToast(`Acesso de ${user.nome} ${updated.ativo ? 'ativado' : 'bloqueado'}.`);
  };

  const handleSelectCurrentUser = (user: UsuarioEquipe | null) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  // PDF DOWNLOAD
  const handleDownloadPdf = async (rdo: RelatorioDiarioObra) => {
    try {
      showToast('Gerando documento PDF oficial...', 'info');
      const obra = obras.find(o => o.id === rdo.obraId);
      await baixarPdfRdo(rdo, obra);
      showToast(`PDF do RDO Nº ${rdo.numero} baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Erro ao compilar PDF.', 'error');
    }
  };

  // SHARE RDO
  const handleShareRdo = async (rdo: RelatorioDiarioObra) => {
    try {
      const obra = obras.find(o => o.id === rdo.obraId);
      showToast('Preparando compartilhamento do RDO...', 'info');
      const res = await compartilharRdo(rdo, obra);
      if (res.success) {
        if (res.method === 'native_share') {
          showToast('Relatório compartilhado com sucesso!');
        } else {
          showToast(`PDF baixado! Pronto para enviar no WhatsApp ou E-mail para o cliente.`);
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      showToast('Não foi possível compartilhar.', 'error');
    }
  };

  // NAVIGATION SHORTCUTS
  const handleOpenNewRdo = (obraId?: string, initialDate?: string) => {
    if (isViewer) {
      if (!currentUser) {
        showToast('Modo Visitante: Identifique-se com um login autorizado para emitir novos RDOs.', 'error');
        setActiveTab('usuarios');
      } else {
        showToast('Acesso Restrito: Usuários com perfil "Visualizador" têm permissão somente de leitura.', 'error');
      }
      return;
    }
    setEditingRdo(null);
    setFormInitialObraId(obraId || (obras[0]?.id));
    setFormInitialDate(initialDate);
    setIsRdoFormOpen(true);
  };

  const handleEditRdo = (rdo: RelatorioDiarioObra) => {
    if (isViewer) {
      showToast('Modo Somente Leitura: Abrindo o RDO em modo de consulta detalhada.', 'info');
      handleViewRdo(rdo);
      return;
    }
    setEditingRdo(rdo);
    setIsRdoFormOpen(true);
  };

  const handleViewRdo = (rdo: RelatorioDiarioObra) => {
    setViewingRdo(rdo);
    setIsRdoViewOpen(true);
  };

  const handleFilterRdosByObra = (obraId: string) => {
    setRdoObraFilter(obraId);
    setActiveTab('rdos');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-amber-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-800 text-slate-100 border-slate-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <FileCheck className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Navbar
        onNewRdo={() => handleOpenNewRdo()}
        onResetData={() => {
          if (confirm('Deseja recarregar os dados de demonstração originais da engenharia?')) {
            StorageService.resetToDefaults();
          }
        }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigateHome={() => {
          setActiveTab('dashboard');
          setIsSidebarOpen(false);
        }}
        currentUser={currentUser}
        canEdit={!isViewer}
        onNavigateUsuarios={() => {
          setActiveTab('usuarios');
          setIsSidebarOpen(false);
        }}
        onNavigateArmazenamento={() => {
          setActiveTab('armazenamento');
          setIsSidebarOpen(false);
        }}
        onNavigateLogin={() => {
          setActiveTab('login');
          setIsSidebarOpen(false);
        }}
        onNavigateLogout={() => {
          setActiveTab('logout');
          setIsSidebarOpen(false);
        }}
        isFirebaseConnected={isFirebaseConnected}
      />

      <div className="flex-1 flex">
        {/* Left Management Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'rdos') setRdoObraFilter('todas');
            setActiveTab(tab);
          }}
          onNewRdo={() => handleOpenNewRdo()}
          canEdit={!isViewer}
          rdosCount={rdos.length}
          obrasCount={obras.length}
          colaboradoresCount={colaboradores.length}
          equipamentosCount={equipamentos.length}
          usuariosCount={usuarios.length}
          currentUser={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col lg:pl-64 sm:lg:pl-72 w-full transition-all duration-200 min-w-0">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            
            {/* Visualizer Warning Banner if active user is viewer */}
            {isViewer && (
              <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block text-sky-950">
                      {currentUser ? `Modo Visualizador Ativo (${currentUser.nome})` : 'Modo Visitante / Link Compartilhado (Somente Leitura)'}
                    </span>
                    <span className="text-sky-800 text-[11px]">
                      Você tem permissão para <strong>consultar relatórios, fotos e baixar PDFs oficiais</strong>. Operações de modificação (criar, editar e excluir) estão protegidas.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('usuarios')}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-[11px] shadow-2xs shrink-0 transition-colors self-end sm:self-auto"
                >
                  {currentUser ? 'Alternar Perfil / Logins' : 'Fazer Login / Entrar'}
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardOverview
                obras={obras}
                rdos={rdos}
                colaboradores={colaboradores}
                canEdit={!isViewer}
                onSelectTab={(tab) => {
                  if (tab === 'rdos') setRdoObraFilter('todas');
                  setActiveTab(tab);
                }}
                onNewRdo={() => handleOpenNewRdo()}
                onNewObra={() => {
                  if (isViewer) {
                    showToast('Acesso Restrito: Usuários com perfil Visualizador não podem cadastrar obras.', 'error');
                    return;
                  }
                  setEditingObra(null);
                  setIsObraModalOpen(true);
                }}
                onViewRdo={handleViewRdo}
                onDownloadPdf={handleDownloadPdf}
                onShareRdo={handleShareRdo}
              />
            )}

            {activeTab === 'obras' && (
              <ObrasList
                obras={obras}
                rdos={rdos}
                canEdit={!isViewer}
                onNewObra={() => {
                  if (isViewer) {
                    showToast('Acesso Restrito: Usuários com perfil Visualizador não podem cadastrar obras.', 'error');
                    return;
                  }
                  setEditingObra(null);
                  setIsObraModalOpen(true);
                }}
                onEditObra={(obra) => {
                  if (isViewer) {
                    showToast('Acesso Restrito: Usuários com perfil Visualizador não podem editar dados da obra.', 'error');
                    return;
                  }
                  setEditingObra(obra);
                  setIsObraModalOpen(true);
                }}
                onDeleteObra={handleDeleteObra}
                onNewRdoForObra={(obraId) => handleOpenNewRdo(obraId)}
                onFilterRdosByObra={handleFilterRdosByObra}
              />
            )}

            {activeTab === 'rdos' && (
              <RdoList
                rdos={rdos}
                obras={obras}
                canEdit={!isViewer}
                onNewRdo={() => handleOpenNewRdo()}
                onViewRdo={handleViewRdo}
                onEditRdo={handleEditRdo}
                onDeleteRdo={handleDeleteRdo}
                onDownloadPdf={handleDownloadPdf}
                onShareRdo={handleShareRdo}
                onNavigatePeriodos={() => setActiveTab('periodos')}
                initialObraFilter={rdoObraFilter}
              />
            )}

            {activeTab === 'periodos' && (
              <PeriodosView
                rdos={rdos}
                obras={obras}
                onViewRdo={handleViewRdo}
                onNewRdoForDate={(data, obraId) => handleOpenNewRdo(obraId, data)}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'colaboradores' && (
              <ColaboradoresView
                colaboradores={colaboradores}
                canEdit={!isViewer}
                onSaveColaborador={handleSaveColaborador}
                onDeleteColaborador={handleDeleteColaborador}
              />
            )}

            {activeTab === 'equipamentos' && (
              <EquipamentosView
                equipamentos={equipamentos}
                canEdit={!isViewer}
                onSaveEquipamento={handleSaveEquipamento}
                onDeleteEquipamento={handleDeleteEquipamento}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsuariosView
                usuarios={usuarios}
                obras={obras}
                currentUser={currentUser}
                canEdit={!isViewer}
                onSelectCurrentUser={handleSelectCurrentUser}
                onNewUsuario={() => {
                  setEditingUsuario(null);
                  setIsUsuarioModalOpen(true);
                }}
                onEditUsuario={(usuario) => {
                  setEditingUsuario(usuario);
                  setIsUsuarioModalOpen(true);
                }}
                onDeleteUsuario={handleDeleteUsuario}
                onToggleStatus={handleToggleStatusUsuario}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'armazenamento' && (
              <StorageSettings
                obras={obras}
                rdos={rdos}
                currentUser={currentUser}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'login' && (
              <LoginView
                usuarios={usuarios}
                currentUser={currentUser}
                onSelectUser={(user) => {
                  StorageService.setCurrentUser(user);
                  setCurrentUser(user);
                }}
                onNavigateTab={(tab) => {
                  if (tab === 'rdos') setRdoObraFilter('todas');
                  setActiveTab(tab);
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'logout' && (
              <LogoutView
                currentUser={currentUser}
                onConfirmLogout={handleConfirmLogout}
                onNavigateTab={(tab) => {
                  if (tab === 'rdos') setRdoObraFilter('todas');
                  setActiveTab(tab);
                }}
                onShowToast={showToast}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-slate-700">RDO Digital • Sistema de Diário de Obra</span>
              </div>
              <div>
                Em conformidade com as boas práticas de engenharia civil, NR-18 e conselhos profissionais (CREA/CAU).
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* MODALS */}
      {/* Obra Modal */}
      {isObraModalOpen && (
        <ObraModal
          isOpen={isObraModalOpen}
          onClose={() => {
            setIsObraModalOpen(false);
            setEditingObra(null);
          }}
          onSave={handleSaveObra}
          editingObra={editingObra}
        />
      )}

      {/* RDO Form Modal */}
      {isRdoFormOpen && (
        <RdoFormModal
          isOpen={isRdoFormOpen}
          onClose={() => {
            setIsRdoFormOpen(false);
            setEditingRdo(null);
          }}
          onSave={handleSaveRdo}
          editingRdo={editingRdo}
          obras={obras}
          colaboradores={colaboradores}
          equipamentos={equipamentos}
          usuarios={usuarios}
          currentUser={currentUser}
          initialObraId={formInitialObraId}
          initialDate={formInitialDate}
        />
      )}

      {/* RDO Detailed View Modal */}
      {isRdoViewOpen && viewingRdo && (
        <RdoViewModal
          isOpen={isRdoViewOpen}
          onClose={() => {
            setIsRdoViewOpen(false);
            setViewingRdo(null);
          }}
          rdo={viewingRdo}
          obra={obras.find(o => o.id === viewingRdo?.obraId)}
          canEdit={!isViewer}
          onDownloadPdf={handleDownloadPdf}
          onShareRdo={handleShareRdo}
          onEditRdo={handleEditRdo}
          onShowToast={showToast}
        />
      )}

      {/* Team User Registration Modal */}
      {isUsuarioModalOpen && (
        <UsuarioModal
          isOpen={isUsuarioModalOpen}
          onClose={() => {
            setIsUsuarioModalOpen(false);
            setEditingUsuario(null);
          }}
          onSave={handleSaveUsuario}
          editingUsuario={editingUsuario}
          obras={obras}
        />
      )}

    </div>
  );
}

