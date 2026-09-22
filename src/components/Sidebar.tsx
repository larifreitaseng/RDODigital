import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Users, 
  Wrench, 
  Plus, 
  X,
  HardHat,
  ChevronRight,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  FolderSync,
  CalendarRange,
  LogIn,
  LogOut
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { UsuarioEquipe } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewRdo: () => void;
  rdosCount: number;
  obrasCount: number;
  colaboradoresCount: number;
  equipamentosCount: number;
  usuariosCount: number;
  currentUser?: UsuarioEquipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewRdo,
  rdosCount,
  obrasCount,
  colaboradoresCount,
  equipamentosCount,
  usuariosCount,
  currentUser,
  isOpen,
  onClose
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
      description: 'Painel e indicadores'
    },
    {
      id: 'obras' as ActiveTab,
      label: 'Obras',
      icon: Building2,
      badge: obrasCount,
      description: 'Contratos e canteiros'
    },
    {
      id: 'rdos' as ActiveTab,
      label: 'Diários (RDO)',
      icon: FileText,
      badge: rdosCount,
      description: 'Registros diários e PDFs'
    },
    {
      id: 'periodos' as ActiveTab,
      label: 'Relatórios por Período',
      icon: CalendarRange,
      badge: null,
      description: 'Filtrar por dia, semana, mês e ano'
    },
    {
      id: 'colaboradores' as ActiveTab,
      label: 'Colaboradores',
      icon: Users,
      badge: colaboradoresCount > 0 ? colaboradoresCount : null,
      description: 'Mão de obra e equipes'
    },
    {
      id: 'equipamentos' as ActiveTab,
      label: 'Equipamentos',
      icon: Wrench,
      badge: equipamentosCount > 0 ? equipamentosCount : null,
      description: 'Maquinário e ferramentas'
    },
    {
      id: 'usuarios' as ActiveTab,
      label: 'Controle de Logins',
      icon: ShieldCheck,
      badge: usuariosCount,
      description: 'Editores e visualizadores'
    },
    {
      id: 'armazenamento' as ActiveTab,
      label: 'Backup e Arquivos',
      icon: FolderSync,
      badge: null,
      description: 'Google Drive Individual'
    }
  ];

  const sessionItems = [
    {
      id: 'login' as ActiveTab,
      label: 'Fazer Login',
      icon: LogIn,
      badge: !currentUser ? 'Acessar' : null,
      description: 'Acessar ou trocar de conta'
    },
    {
      id: 'logout' as ActiveTab,
      label: 'Sair do App',
      icon: LogOut,
      badge: null,
      description: 'Encerrar sessão ativa'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 sm:w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          
          {/* Section Label */}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Painel de Gerenciamento
            </span>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button */}
          <div>
            <button
              id="sidebar-btn-novo-rdo"
              onClick={() => {
                onNewRdo();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Emitir Novo RDO</span>
            </button>
          </div>

          {/* Navigation Links Group */}
          <nav className="space-y-1.5" aria-label="Menu Principal">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400 transition-colors'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700/80 group-hover:border-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Session and Auth Management Group */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Sessão e Acesso
            </span>
            <div className="space-y-1">
              {sessionItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isLogout = item.id === 'logout';

                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? isLogout
                          ? 'bg-rose-600 text-white font-bold shadow-xs'
                          : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : isLogout
                          ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? isLogout ? 'text-white' : 'text-slate-950'
                          : isLogout ? 'text-rose-400' : 'text-slate-400 group-hover:text-amber-400'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Status Card */}
          {currentUser ? (
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {currentUser.nome}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentUser.cargo}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-center space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Nenhum usuário conectado
              </span>
              <button
                onClick={() => {
                  setActiveTab('login');
                  onClose();
                }}
                className="w-full text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar agora</span>
              </button>
            </div>
          )}

          {/* Canteiro e Status info card */}
          <div className="pt-2">
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <HardHat className="w-4 h-4" />
                <span>Gestão Técnica Ativa</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Relatórios em conformidade com as exigências técnicas do CREA e NR-18.
              </p>
            </div>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">RDO Online e Local</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.2</span>
        </div>

      </aside>
    </>
  );
};
