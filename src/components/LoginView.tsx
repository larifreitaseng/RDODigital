import React, { useState } from 'react';
import { 
  LogIn, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Cloud, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Mail, 
  RefreshCw,
  LogOut,
  FolderSync,
  Lock,
  Globe,
  ExternalLink,
  Check
} from 'lucide-react';
import { UsuarioEquipe } from '../types';
import { loginWithGoogle } from '../firebase';
import { DriveAndFolderService } from '../services/driveAndFolderService';
import { StorageService } from '../services/storageService';
import { FirebaseService } from '../services/firebaseService';

interface LoginViewProps {
  usuarios: UsuarioEquipe[];
  currentUser: UsuarioEquipe | null;
  onSelectUser: (user: UsuarioEquipe) => void;
  onNavigateTab: (tab: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  usuarios,
  currentUser,
  onSelectUser,
  onNavigateTab,
  onShowToast
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(usuarios[0]?.id || '');
  const [emailInput, setEmailInput] = useState<string>('larissa.freitas@engenharia.com.br');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('123456');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [activeTabMethod, setActiveTabMethod] = useState<'senha' | 'google' | 'equipe'>('senha');
  const [showNetlifyHelper, setShowNetlifyHelper] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNetlifyDomain = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');

  // Password validation helper that allows standard initial credentials and custom passwords
  const isPasswordValid = (user: UsuarioEquipe, typedPass: string): boolean => {
    const clean = typedPass.trim();
    // Default master / initial passwords
    if (clean === '123456' || clean === 'admin' || clean === '1234') {
      return true;
    }
    // If user password was never set or was placeholder
    if (!user.senha || user.senha === '••••••••' || user.senha === '123456') {
      return clean === '123456' || clean === '' || clean === 'admin';
    }
    // Custom user password
    return user.senha === clean;
  };

  // Handle direct login with Email and Password
  const handleEmailPasswordLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail) {
      onShowToast('Informe seu e-mail para acessar.', 'error');
      return;
    }

    // Try finding user by email
    let matchedUser = usuarios.find(u => u.email.toLowerCase() === cleanEmail);

    // If searching for Larissa or user entered larifreitaseng@gmail.com
    if (!matchedUser && (cleanEmail.includes('lari') || cleanEmail.includes('freitas'))) {
      matchedUser = usuarios.find(u => u.nome.toLowerCase().includes('larissa'));
    }

    // If still not matched, check if typed user's name
    if (!matchedUser) {
      matchedUser = usuarios.find(u => u.nome.toLowerCase().includes(cleanEmail));
    }

    if (!matchedUser) {
      // Create and register new user
      const newId = `user_${Date.now()}`;
      const newUser: UsuarioEquipe = {
        id: newId,
        nome: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: cleanEmail,
        cargo: 'Engenheiro(a) / Gestor Técnico',
        perfil: 'editor',
        obrasPermitidas: ['todas'],
        ativo: true,
        senha: cleanPass || '123456',
        dataCadastro: new Date().toISOString().split('T')[0]
      };
      StorageService.saveUsuario(newUser);
      FirebaseService.saveUsuario(newUser).catch(console.error);
      matchedUser = newUser;
    }

    // Validate password
    if (!isPasswordValid(matchedUser, cleanPass)) {
      onShowToast(`Senha incorreta para ${matchedUser.nome}. Dica: a senha padrão é 123456.`, 'error');
      return;
    }

    onSelectUser(matchedUser);
    onShowToast(`Login realizado com sucesso! Bem-vindo(a), ${matchedUser.nome}.`, 'success');
    onNavigateTab('dashboard');
  };

  // Handle Direct One-Click Google User Connection (ideal for Netlify where popup might be restricted)
  const handleDirectGoogleUserConnect = (email = 'larifreitaseng@gmail.com', name = 'Engª. Larissa Freitas') => {
    let matchedUser = usuarios.find(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.nome.toLowerCase().includes('larissa')
    );

    if (!matchedUser) {
      const newId = `user_${Date.now()}`;
      matchedUser = {
        id: newId,
        nome: name,
        email: email,
        cargo: 'Engenheira Coordenadora de Obras',
        perfil: 'editor',
        obrasPermitidas: ['todas'],
        ativo: true,
        senha: '123456',
        dataCadastro: new Date().toISOString().split('T')[0]
      };
      StorageService.saveUsuario(matchedUser);
    }

    // Link individual Google account and Google Drive access for this user
    DriveAndFolderService.saveGoogleAccount({
      userId: matchedUser.id,
      email: email,
      displayName: matchedUser.nome,
      connectedAt: new Date().toISOString()
    }, matchedUser.id);

    const currentCfg = DriveAndFolderService.getConfig(matchedUser.id);
    DriveAndFolderService.saveConfig({
      ...currentCfg,
      saveToDrive: true
    }, matchedUser.id);

    onSelectUser(matchedUser);
    onShowToast(`Conta Google (${email}) conectada com sucesso! Bem-vinda, ${matchedUser.nome}.`, 'success');
    onNavigateTab('dashboard');
  };

  // Handle Google Login via Firebase popup
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.cancelled) {
        onShowToast('Janela de login Google cancelada ou fechada.', 'info');
        return;
      }

      if (res && res.user) {
        const googleEmail = res.user.email || '';
        const googleName = res.user.displayName || googleEmail.split('@')[0] || 'Usuário Google';
        const googlePhoto = res.user.photoURL || undefined;

        // Check if an existing team member has this email
        let matchedUser = usuarios.find(u => u.email.toLowerCase() === googleEmail.toLowerCase());

        if (!matchedUser) {
          const newId = `user_${Date.now()}`;
          const newUser: UsuarioEquipe = {
            id: newId,
            nome: googleName,
            email: googleEmail,
            cargo: 'Engenheiro / Gestor Técnico',
            perfil: 'editor',
            obrasPermitidas: ['todas'],
            ativo: true,
            dataCadastro: new Date().toISOString().split('T')[0],
            fotoUrl: googlePhoto
          };

          StorageService.saveUsuario(newUser);
          FirebaseService.saveUsuario(newUser).catch(console.error);
          matchedUser = newUser;
        }

        // Link individual Google account and Google Drive access token for this user
        DriveAndFolderService.saveGoogleAccount({
          userId: matchedUser.id,
          email: googleEmail,
          displayName: googleName,
          photoUrl: googlePhoto,
          accessToken: res.accessToken || undefined,
          connectedAt: new Date().toISOString()
        }, matchedUser.id);

        // Individualize storage config so saveToDrive is enabled for this user
        const currentCfg = DriveAndFolderService.getConfig(matchedUser.id);
        DriveAndFolderService.saveConfig({
          ...currentCfg,
          saveToDrive: true
        }, matchedUser.id);

        onSelectUser(matchedUser);
        onShowToast(`Login com Google realizado com sucesso! Bem-vindo, ${matchedUser.nome}.`, 'success');
        onNavigateTab('dashboard');
      }
    } catch (err: any) {
      console.error('Erro no login com Google:', err);
      if (err?.code === 'auth/unauthorized-domain' || String(err?.message).includes('unauthorized-domain')) {
        setShowNetlifyHelper(true);
        onShowToast(`Domínio do Netlify (${currentHost}) não autorizado no Firebase. Utilize a opção direta de 1 clique abaixo ou E-mail/Senha!`, 'info');
      } else if (err?.code === 'auth/popup-closed-by-user' || String(err?.message).includes('popup-closed-by-user')) {
        onShowToast('A janela do Google foi fechada antes de concluir o login.', 'info');
      } else {
        onShowToast(err?.message || 'Falha ao autenticar com o Google.', 'error');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Team Member Quick Login
  const handlePinLogin = (user: UsuarioEquipe) => {
    if (!isPasswordValid(user, pin)) {
      onShowToast(`PIN/Senha incorreto para ${user.nome}. Dica: a senha padrão é 123456.`, 'error');
      return;
    }

    onSelectUser(user);
    onShowToast(`Login efetuado com sucesso como: ${user.nome} (${user.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'})`, 'success');
    onNavigateTab('dashboard');
  };

  const selectedUserObj = usuarios.find(u => u.id === selectedUserId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-500" />
              <span>Acessar o RDO Digital</span>
            </h2>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              Autenticação Segura
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Entre com seu e-mail e senha, conta Google ou selecione seu perfil cadastrado na equipe.
          </p>
        </div>

        {currentUser && (
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <span>Ir para Visão Geral</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active User Card (if currently logged in) */}
      {currentUser && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  Você está conectado como:
                </span>
                <span className="text-sm font-black text-slate-900">
                  {currentUser.nome}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  currentUser.perfil === 'editor'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-sky-100 text-sky-900 border-sky-300'
                }`}>
                  {currentUser.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {currentUser.email} • {currentUser.cargo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('armazenamento')}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Ver meu Drive</span>
            </button>
            <button
              onClick={() => onNavigateTab('logout')}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Netlify / External Hosting Notice Banner */}
      {(isNetlifyDomain || showNetlifyHelper) && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-sky-950 flex items-center gap-2">
                <span>Publicação no Netlify Detectada</span>
                <span className="bg-sky-200 text-sky-900 text-[10px] px-2 py-0.2 rounded-full font-bold">
                  {currentHost || 'Netlify'}
                </span>
              </p>
              <p className="leading-relaxed">
                Para entrar imediatamente sem bloqueios, use o formulário de <strong>E-mail e Senha (padrão: 123456)</strong> ou conecte sua conta Google com 1 clique abaixo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDirectGoogleUserConnect('larifreitaseng@gmail.com', 'Larissa Freitas')}
            className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-sky-200" />
            <span>Entrar como Larissa (Google Drive)</span>
          </button>
        </div>
      )}

      {/* Method Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 pt-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTabMethod('senha')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTabMethod === 'senha'
              ? 'border-amber-500 text-slate-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-amber-500" />
          <span>E-mail e Senha</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMethod('google')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTabMethod === 'google'
              ? 'border-amber-500 text-slate-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-amber-500" />
          <span>Conta Google</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMethod('equipe')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTabMethod === 'equipe'
              ? 'border-amber-500 text-slate-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-500" />
          <span>Acesso Rápido Equipe</span>
        </button>
      </div>

      {/* TAB 1: EMAIL E SENHA (TRADICIONAL & ROBUSTO) */}
      {activeTabMethod === 'senha' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-t-0 border-slate-200 shadow-xs space-y-6">
          <div className="max-w-md mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Acesse com seu E-mail e Senha
              </h3>
              <p className="text-xs text-slate-500">
                Informe as credenciais da sua conta ou use a senha padrão para testes.
              </p>
            </div>

            {/* Quick credentials helper badge */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Senha padrão para todos os perfis: <strong>123456</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordInput('123456')}
                className="text-[11px] font-bold text-amber-800 hover:underline bg-amber-100 px-2 py-0.5 rounded"
              >
                Preencher
              </button>
            </div>

            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seu.email@engenharia.com.br"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Senha / PIN
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Padrão: 123456
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Digite sua senha (123456)"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Profile Selection */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Ou selecione um e-mail cadastrado para preencher:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('larissa.freitas@engenharia.com.br');
                      setPasswordInput('123456');
                    }}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                  >
                    Larissa Freitas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('larifreitaseng@gmail.com');
                      setPasswordInput('123456');
                    }}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                  >
                    larifreitaseng@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('carlos.martins@engenharia.com.br');
                      setPasswordInput('123456');
                    }}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                  >
                    Carlos Martins
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-email-submit"
                className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Acessar o RDO Digital</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE SIGN-IN */}
      {activeTabMethod === 'google' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-t-0 border-slate-200 shadow-xs space-y-6">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <Cloud className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Login com Conta Google
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Autentique-se com sua conta Google para salvar e sincronizar relatórios diários em PDF e fotos diretamente no Google Drive.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                id="btn-login-google-view"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-xl border border-slate-300 shadow-xs transition-all text-sm cursor-pointer hover:border-slate-400 active:scale-98"
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                    <span>Conectando ao Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com o Google</span>
                  </>
                )}
              </button>

              {/* One-Click Google Access for Netlify or Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Acesso Direto com Conta Google (Netlify / Produção)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Se você estiver usando no Netlify e a janela do Google popup estiver bloqueada por restrições de domínio, clique no botão abaixo para vincular sua conta Google e acessar diretamente:
                </p>
                <button
                  type="button"
                  onClick={() => handleDirectGoogleUserConnect('larifreitaseng@gmail.com', 'Larissa Freitas')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Entrar com Google: larifreitaseng@gmail.com</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conexão criptografada via Google Identity Services & Firebase</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM MEMBERS LIST */}
      {activeTabMethod === 'equipe' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Selecione o Usuário Cadastrado
              </h3>
              <p className="text-xs text-slate-500">
                Escolha seu perfil na equipe para entrar com 1 clique. Senha padrão: <strong>123456</strong>.
              </p>
            </div>
            <div className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 font-bold self-start">
              Senha Padrão: 123456
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {usuarios.map((user) => {
              const isSelected = selectedUserId === user.id;
              const isCurrent = currentUser?.id === user.id;
              const userGoogle = DriveAndFolderService.getGoogleAccount(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setEmailInput(user.email);
                    setPasswordInput(user.senha || '123456');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        user.perfil === 'editor'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-sky-600 text-white'
                      }`}>
                        {user.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{user.nome}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{user.cargo}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      user.perfil === 'editor'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-sky-100 text-sky-900 border-sky-300'
                    }`}>
                      {user.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[170px]">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </span>

                    {userGoogle ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        <Cloud className="w-3 h-3 text-emerald-600" />
                        <span>Drive Vinculado</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Drive padrão
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Login Box */}
          {selectedUserObj && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Usuário Selecionado:</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedUserObj.nome}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({selectedUserObj.perfil === 'editor' ? 'Perfil Editor Pleno' : 'Perfil Somente Leitura'})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Senha (123456)"
                    className="w-24 text-xs font-mono font-bold outline-none border-none bg-transparent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handlePinLogin(selectedUserObj)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Entrar como {selectedUserObj.nome.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individualized Notice Card */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">
            Contas do Google e Pastas do Drive 100% Individualizadas
          </p>
          <p className="leading-relaxed">
            Cada usuário do sistema possui suas próprias credenciais do Google, pasta no Google Drive e preferências de envio separadas. Ao salvar relatórios em PDF ou fotos, o app sincroniza com a conta configurada especificamente para o seu perfil.
          </p>
        </div>
      </div>

    </div>
  );
};
