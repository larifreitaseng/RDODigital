import React from 'react';
import { 
  HardHat, 
  Plus, 
  RotateCcw, 
  Menu, 
  Calendar, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  UserCheck,
  Cloud,
  Database,
  FolderSync,
  LogIn,
  LogOut
} from 'lucide-react';
import { UsuarioEquipe } from '../types';

export type ActiveTab = 'dashboard' | 'obras' | 'rdos' | 'periodos' | 'colaboradores' | 'equipamentos' | 'usuarios' | 'armazenamento' | 'login' | 'logout';

interface NavbarProps {
  onNewRdo: () => void;
  onResetData: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigateHome: () => void;
  currentUser?: UsuarioEquipe | null;
  onNavigateUsuarios?: () => void;
  onNavigateArmazenamento?: () => void;
  onNavigateLogin?: () => void;
  onNavigateLogout?: () => void;
  isFirebaseConnected?: boolean;
  canEdit?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewRdo,
  onResetData,
  onToggleSidebar,
  isSidebarOpen,
  onNavigateHome,
  currentUser,
  onNavigateUsuarios,
  onNavigateArmazenamento,
  onNavigateLogin,
  onNavigateLogout,
  isFirebaseConnected = true,
  canEdit = true
}) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isEditor = currentUser?.perfil === 'editor';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Sidebar Toggle e Brand Header */}
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors lg:hidden"
              title={isSidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
              aria-label="Alternar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer group select-none" 
              onClick={onNavigateHome}
              title="Ir para Visão Geral"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-sm group-hover:bg-amber-400 transition-colors">
                <HardHat className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">RDO Digital</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                    Engenharia Civil
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Diário de Obras e Gestão de Canteiro</p>
              </div>
            </div>
          </div>

          {/* Center / Right Header Info */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Logged User Role Badge or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {onNavigateUsuarios && (
                  <button
                    id="header-user-badge"
                    onClick={onNavigateUsuarios}
                    title={`Logado como ${currentUser.nome} (${isEditor ? 'Pode Modificar' : 'Visualizador'}). Clique para gerenciar acessos.`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all hover:opacity-95 ${
                      isEditor
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      isEditor ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'
                    }`}>
                      {isEditor ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </div>
                    <div className="text-left hidden sm:block">
                      <span className="font-bold block leading-tight text-[11px] text-white truncate max-w-[130px]">
                        {currentUser.nome.split(' ')[0]} {currentUser.nome.split(' ')[1] || ''}
                      </span>
                      <span className="text-[10px] font-semibold opacity-80 block leading-none">
                        {isEditor ? 'Pode Modificar' : 'Visualizador'}
                      </span>
                    </div>
                  </button>
                )}

                {onNavigateLogout && (
                  <button
                    id="header-btn-sair"
                    onClick={onNavigateLogout}
                    title="Sair do App / Encerrar Sessão"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                    aria-label="Sair do aplicativo"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              onNavigateLogin && (
                <button
                  id="header-btn-login"
                  onClick={onNavigateLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Fazer Login</span>
                </button>
              )
            )}

            {/* Storage / Backup Quick Link */}
            {onNavigateArmazenamento && (
              <button
                id="btn-nav-armazenamento"
                onClick={onNavigateArmazenamento}
                title="Configurar Google Drive e Pasta do Computador"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white hover:border-slate-600 text-xs transition-colors"
              >
                <FolderSync className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Drive e Pastas</span>
              </button>
            )}

            {/* Firebase Live Cloud Status Indicator */}
            <div 
              id="firebase-cloud-status"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                isFirebaseConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
              title={isFirebaseConnected ? 'Firebase Firestore conectado. Sincronização em tempo real ativa.' : 'Conectando ao Firebase Firestore...'}
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <Cloud className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="hidden md:inline">Firebase {isFirebaseConnected ? 'Online' : 'Conectando'}</span>
            </div>

            {/* System Status / Date Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="capitalize">{currentDate}</span>
            </div>

            {/* Header Action Buttons */}
            {canEdit ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-novo-rdo-header"
                  onClick={onNewRdo}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition-all transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Emitir Novo RDO</span>
                  <span className="sm:hidden">Novo RDO</span>
                </button>

                <button
                  id="btn-reset-demo"
                  onClick={onResetData}
                  title="Restaurar dados de demonstração da engenharia"
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-amber-400 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Leitura</span>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

