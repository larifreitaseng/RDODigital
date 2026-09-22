import React from 'react';
import { 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  LogIn, 
  ArrowLeft, 
  Cloud, 
  FolderSync, 
  UserX,
  Building2,
  HardHat
} from 'lucide-react';
import { UsuarioEquipe } from '../types';
import { logoutUser } from '../firebase';
import { DriveAndFolderService } from '../services/driveAndFolderService';

interface LogoutViewProps {
  currentUser: UsuarioEquipe | null;
  onConfirmLogout: () => void;
  onNavigateTab: (tab: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const LogoutView: React.FC<LogoutViewProps> = ({
  currentUser,
  onConfirmLogout,
  onNavigateTab,
  onShowToast
}) => {
  const handlePerformLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Erro ao deslogar do Firebase:', e);
    }
    onConfirmLogout();
    onShowToast('Sessão encerrada com sucesso! Você saiu do aplicativo.', 'info');
    onNavigateTab('login');
  };

  const userGoogle = currentUser ? DriveAndFolderService.getGoogleAccount(currentUser.id) : null;
  const userCfg = currentUser ? DriveAndFolderService.getConfig(currentUser.id) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-500" />
              <span>Sair do Aplicativo</span>
            </h2>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              Encerrar Sessão
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Encerre sua sessão atual para proteger os lançamentos do canteiro de obras.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar à Visão Geral</span>
        </button>
      </div>

      {currentUser ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          
          {/* User Profile Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-xs ${
                currentUser.perfil === 'editor'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-sky-600 text-white'
              }`}>
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {currentUser.nome}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    currentUser.perfil === 'editor'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-sky-100 text-sky-900 border-sky-300'
                  }`}>
                    {currentUser.perfil === 'editor' ? 'Editor Pleno' : 'Visualizador'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentUser.email} • {currentUser.cargo}
                </p>
              </div>
            </div>

            {userGoogle && (
              <div className="text-right text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 self-start sm:self-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Google Drive Vinculado</span>
                <span className="font-semibold text-slate-700 truncate max-w-[180px] inline-block">
                  {userGoogle.email}
                </span>
              </div>
            )}
          </div>

          {/* Safety Information */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>O que acontece ao sair?</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-600">
              <li>Sua sessão neste navegador será finalizada com segurança.</li>
              <li>Todos os diários de obra e fotos já salvos continuam preservados no <strong>Firebase Firestore</strong>.</li>
              <li>Suas configurações e pastas individuais do <strong>Google Drive</strong> permanecem salvas para quando você fizer login novamente.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors text-center"
            >
              Cancelar e Permanecer Conectado
            </button>

            <button
              id="btn-confirm-logout-view"
              type="button"
              onClick={handlePerformLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmar e Sair do App</span>
            </button>
          </div>

        </div>
      ) : (
        /* Already Logged Out Card */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <UserX className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Você está desconectado do aplicativo
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhuma sessão de usuário ativa no momento. Para emitir ou gerenciar os diários de obra, faça login com sua conta.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('login')}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Fazer Login Novamente</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
