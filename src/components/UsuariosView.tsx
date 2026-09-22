import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  UserCheck, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  AlertCircle, 
  KeyRound,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { UsuarioEquipe, PerfilUsuario, Obra } from '../types';

interface UsuariosViewProps {
  usuarios: UsuarioEquipe[];
  obras: Obra[];
  currentUser: UsuarioEquipe | null;
  onSelectCurrentUser: (usuario: UsuarioEquipe | null) => void;
  onNewUsuario: () => void;
  onEditUsuario: (usuario: UsuarioEquipe) => void;
  onDeleteUsuario: (id: string) => void;
  onToggleStatus: (usuario: UsuarioEquipe) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  canEdit?: boolean;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  obras,
  currentUser,
  onSelectCurrentUser,
  onNewUsuario,
  onEditUsuario,
  onDeleteUsuario,
  onToggleStatus,
  onShowToast,
  canEdit = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Statistics
  const totalUsuarios = usuarios.length;
  const totalEditores = usuarios.filter(u => u.perfil === 'editor').length;
  const totalVisualizadores = usuarios.filter(u => u.perfil === 'visualizador').length;
  const totalAtivos = usuarios.filter(u => u.ativo).length;

  // Filter list
  const filteredUsuarios = usuarios.filter(u => {
    const matchesPerfil = filterPerfil === 'todos' || u.perfil === filterPerfil;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.cargo.toLowerCase().includes(term) ||
      (u.telefone && u.telefone.includes(term));

    return matchesPerfil && matchesSearch;
  });

  const getObraName = (obraId: string) => {
    return obras.find(o => o.id === obraId)?.nome || obraId;
  };

  const handleCopyCredentials = (u: UsuarioEquipe) => {
    const text = `📋 ACESSO AO RDO DIGITAL\nNome: ${u.nome}\nCargo: ${u.cargo}\nPerfil: ${u.perfil === 'editor' ? 'Editor (Pode Modificar)' : 'Visualizador (Somente Leitura)'}\nLogin: ${u.email}\nSenha/PIN: ${u.senha || '123456'}\nObras: ${u.obrasPermitidas.includes('todas') ? 'Todas as Obras' : u.obrasPermitidas.map(id => getObraName(id)).join(', ')}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    onShowToast(`Dados de login de ${u.nome} copiados com sucesso!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Controle e Cadastro de Logins da Equipe
            </h2>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {usuarios.length} usuários
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerenciamento de permissões: usuários com autorização para <strong>modificar</strong> (criar, editar e excluir) e usuários <strong>visualizadores</strong> (somente leitura e relatórios).
          </p>
        </div>

        {canEdit && (
          <button
            onClick={onNewUsuario}
            id="btn-cadastrar-novo-login"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Novo Login</span>
          </button>
        )}
      </div>

      {/* ACTIVE USER SIMULATOR / CONTROLLER BANNER */}
      {currentUser ? (
        <div className={`p-4 rounded-2xl border transition-all shadow-2xs ${
          currentUser.perfil === 'editor'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-sky-500/10 border-sky-500/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-xs ${
                currentUser.perfil === 'editor'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-sky-600 text-white'
              }`}>
                {currentUser.perfil === 'editor' ? <Edit3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Usuário Ativo na Sessão:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentUser.nome}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    currentUser.perfil === 'editor'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-sky-100 text-sky-900 border-sky-300'
                  }`}>
                    {currentUser.perfil === 'editor' ? 'Perfil: Pode Modificar (Editor)' : 'Perfil: Visualizador (Somente Leitura)'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1">
                  {currentUser.perfil === 'editor' ? (
                    <span>
                      Você tem <strong>permissão total</strong> para emitir novos RDOs, editar diários existentes, registrar ocorrências, adicionar fotos e excluir registros.
                    </span>
                  ) : (
                    <span>
                      Seu acesso está em <strong>modo somente leitura</strong>. Você pode acompanhar todas as obras, visualizar fotos e baixar relatórios em PDF, sem alterar nenhum dado.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Switcher & Logout to Visitor Mode */}
            <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-[11px] text-slate-600 font-medium">
                  Alternar login:
                </div>
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const selected = usuarios.find(u => u.id === e.target.value);
                    if (selected) {
                      onSelectCurrentUser(selected);
                      onShowToast(`Sessão alterada para: ${selected.nome} (${selected.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'})`);
                    }
                  }}
                  className="text-xs font-bold border-none bg-slate-50 py-1.5 px-2.5 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.perfil === 'editor' ? 'Editor' : 'Visualizador'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  onSelectCurrentUser(null);
                  onShowToast('Sessão desconectada. Você está no Modo Visitante (somente leitura).', 'info');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                title="Desconectar e voltar para o Modo Visitante protegido"
              >
                Sair (Modo Visitante)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border bg-slate-900 text-white border-slate-800 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Modo Visitante Ativo (Sem Conta Conectada)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    Somente Leitura e Visualização
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Ao compartilhar este link, os visitantes podem consultar todos os diários de obra e baixar PDFs oficiais, <strong>sem poder alterar, criar ou apagar relatórios</strong>. Para fazer modificações, escolha sua conta abaixo para fazer login.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0 bg-slate-800 p-2 rounded-xl border border-slate-700">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px] text-slate-300 font-medium">
                Entrar como:
              </div>
              <select
                defaultValue=""
                onChange={(e) => {
                  const selected = usuarios.find(u => u.id === e.target.value);
                  if (selected) {
                    onSelectCurrentUser(selected);
                    onShowToast(`Login efetuado como ${selected.nome}! Permissão: ${selected.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'}`);
                  }
                }}
                className="text-xs font-bold border-none bg-slate-900 py-1.5 px-2.5 rounded-lg text-amber-300 focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="" disabled>Selecione um login...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.perfil === 'editor' ? 'Editor' : 'Visualizador'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Users */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total de Logins</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalUsuarios}</span>
            <span className="text-[11px] text-slate-500">membros</span>
          </div>
        </div>

        {/* Editores (Podem Modificar) */}
        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Podem Modificar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{totalEditores}</span>
            <span className="text-[11px] font-semibold text-amber-800">Editores Plenos</span>
          </div>
        </div>

        {/* Visualizadores (Somente Leitura) */}
        <div className="bg-white p-4 rounded-xl border border-sky-300 shadow-2xs bg-sky-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900">Visualizadores</span>
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-950">{totalVisualizadores}</span>
            <span className="text-[11px] font-semibold text-sky-800">Somente Leitura</span>
          </div>
        </div>

        {/* Ativos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Status dos Acessos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{totalAtivos}</span>
            <span className="text-[11px] text-slate-500">ativos no sistema</span>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Filter by Profile */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filtrar por Perfil:</span>
          <select
            value={filterPerfil}
            onChange={(e) => setFilterPerfil(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
          >
            <option value="todos">Todos os Perfis ({usuarios.length})</option>
            <option value="editor">Apenas Editores (Podem Modificar) ({totalEditores})</option>
            <option value="visualizador">Apenas Visualizadores (Somente Leitura) ({totalVisualizadores})</option>
          </select>
        </div>

      </div>

      {/* Users Grid */}
      {filteredUsuarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum usuário encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm ? 'Nenhum login corresponde aos termos da pesquisa.' : 'Cadastre o primeiro login da equipe para liberar acesso ao sistema de RDO.'}
          </p>
          <button
            onClick={onNewUsuario}
            className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Login
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsuarios.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            const isEditor = user.perfil === 'editor';

            return (
              <div
                key={user.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs relative ${
                  isCurrent 
                    ? 'border-amber-400 ring-2 ring-amber-400/30' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top User Info */}
                <div className="space-y-3">
                  
                  {/* Avatar, Name, Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-xs ${
                        isEditor
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-sky-100 text-sky-900 border border-sky-300'
                      }`}>
                        {user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{user.nome}</h3>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold bg-slate-900 text-amber-400 px-2 py-0.5 rounded-full">
                              Você está logado aqui
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{user.cargo}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => onToggleStatus(user)}
                      title="Clique para alternar o status do acesso"
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                        user.ativo
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      {user.ativo ? '● Ativo' : '✕ Bloqueado'}
                    </button>
                  </div>

                  {/* Profile / Permission Badge */}
                  <div className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs" style={{
                    backgroundColor: isEditor ? '#FFFBEB' : '#F0F9FF',
                    borderColor: isEditor ? '#FDE68A' : '#BAE6FD'
                  }}>
                    <div className="flex items-center gap-2">
                      {isEditor ? (
                        <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Edit3 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {isEditor ? 'Pode Modificar (Editor)' : 'Visualizador (Somente Leitura)'}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {isEditor 
                            ? 'Permissão para criar, alterar e excluir RDOs' 
                            : 'Permissão para consulta, fotos e relatórios PDF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials e Contacts */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700 truncate">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Senha/PIN:</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {user.senha || '123456'}
                      </span>
                    </div>

                    {user.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.telefone}</span>
                      </div>
                    )}
                  </div>

                  {/* Authorized Obras */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Obras com Acesso Liberado:
                    </span>
                    {user.obrasPermitidas.includes('todas') ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Building2 className="w-3 h-3 text-emerald-600" /> Todas as Obras do Sistema
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.obrasPermitidas.map((obraId) => (
                          <span
                            key={obraId}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                          >
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {getObraName(obraId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Last Access */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Cadastrado em: {user.dataCadastro}</span>
                    <span>Último acesso: {user.ultimoAcesso || 'Recente'}</span>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Toggle current session simulator */}
                  <button
                    onClick={() => {
                      onSelectCurrentUser(user);
                      onShowToast(`Você agora está visualizando o sistema como ${user.nome} (${user.perfil === 'editor' ? 'Pode Modificar' : 'Visualizador'})`);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-slate-900 text-amber-400 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Simular o acesso e permissões deste usuário"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isCurrent ? 'Sessão Atual' : 'Acessar como'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Credentials */}
                    <button
                      onClick={() => handleCopyCredentials(user)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Copiar dados de login para envio ao colaborador"
                    >
                      {copiedId === user.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{copiedId === user.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    {/* Edit & Delete Actions (Editors only) */}
                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEditUsuario(user)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar dados e permissões"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o login de ${user.nome}?`)) {
                              onDeleteUsuario(user.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir login"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Informational Comparison Box */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Info className="w-4 h-4" />
          <span>Matriz de Permissões de Acesso ao Sistema de RDO</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Edit3 className="w-4 h-4" />
              <span>Usuários que Podem Modificar (Editores)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Destinado a <strong>Engenheiros Residentes, Coordenadores de Obras e Encarregados de Campo</strong>.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Criar, emitir e preencher novos Relatórios Diários de Obra (RDO);</li>
              <li>Tirar fotos no canteiro e carregar da galeria;</li>
              <li>Editar diários já emitidos e corrigir apontamentos;</li>
              <li>Cadastrar obras, mão de obra e equipamentos;</li>
              <li>Excluir registros quando necessário.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Eye className="w-4 h-4" />
              <span>Usuários Visualizadores (Somente Leitura)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Destinado a <strong>Fiscais da Prefeitura/Contratante, Auditores, Clientes e Diretoria</strong>.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Consultar o histórico completo de diários de obra;</li>
              <li>Visualizar o relatório fotográfico de avanço físico;</li>
              <li>Acompanhar efetivo de mão de obra e condições climáticas;</li>
              <li>Gerar e baixar o PDF oficial dos RDOs para auditoria;</li>
              <li><strong>Protegido:</strong> não pode alterar, editar ou excluir dados.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
