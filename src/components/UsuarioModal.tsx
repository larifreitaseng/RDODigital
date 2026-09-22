import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  Phone, 
  Building2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { UsuarioEquipe, PerfilUsuario, Obra } from '../types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (usuario: UsuarioEquipe) => void;
  editingUsuario?: UsuarioEquipe | null;
  obras: Obra[];
}

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUsuario,
  obras
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('editor');
  const [todasObras, setTodasObras] = useState(true);
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (editingUsuario) {
      setNome(editingUsuario.nome);
      setEmail(editingUsuario.email);
      setSenha(editingUsuario.senha || '123456');
      setCargo(editingUsuario.cargo);
      setTelefone(editingUsuario.telefone || '');
      setPerfil(editingUsuario.perfil);
      setAtivo(editingUsuario.ativo);
      if (editingUsuario.obrasPermitidas.includes('todas')) {
        setTodasObras(true);
        setObrasSelecionadas([]);
      } else {
        setTodasObras(false);
        setObrasSelecionadas(editingUsuario.obrasPermitidas);
      }
    } else {
      setNome('');
      setEmail('');
      setSenha('123456');
      setCargo('Engenheiro Civil');
      setTelefone('');
      setPerfil('editor');
      setTodasObras(true);
      setObrasSelecionadas([]);
      setAtivo(true);
    }
    setErro(null);
  }, [editingUsuario, isOpen]);

  if (!isOpen) return null;

  const handleToggleObra = (obraId: string) => {
    if (obrasSelecionadas.includes(obraId)) {
      setObrasSelecionadas(obrasSelecionadas.filter(id => id !== obraId));
    } else {
      setObrasSelecionadas([...obrasSelecionadas, obraId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro('Informe o nome completo do membro da equipe.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido para login de acesso.');
      return;
    }
    if (!cargo.trim()) {
      setErro('Informe o cargo ou função técnica na obra.');
      return;
    }
    if (!todasObras && obrasSelecionadas.length === 0) {
      setErro('Selecione pelo menos uma obra autorizada ou marque acesso a todas.');
      return;
    }

    const novoUsuario: UsuarioEquipe = {
      id: editingUsuario ? editingUsuario.id : `user-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senha.trim() || '123456',
      cargo: cargo.trim(),
      telefone: telefone.trim(),
      perfil,
      obrasPermitidas: todasObras ? ['todas'] : obrasSelecionadas,
      ativo,
      ultimoAcesso: editingUsuario?.ultimoAcesso || 'Nunca acessou',
      dataCadastro: editingUsuario?.dataCadastro || new Date().toISOString().split('T')[0]
    };

    onSave(novoUsuario);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {editingUsuario ? 'Editar Cadastro de Login' : 'Cadastrar Novo Login de Acesso'}
              </h3>
              <p className="text-xs text-slate-400">
                Defina o perfil de permissão: modificação ou apenas visualização
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* PERFIL DE ACESSO (SELETOR DE MODIFICAÇÃO VS VISUALIZADOR) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nível de Permissão no RDO *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Editor (Pode Modificar) */}
              <div 
                onClick={() => setPerfil('editor')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  perfil === 'editor'
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <span>Pode Modificar</span>
                  </div>
                  {perfil === 'editor' && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-2.5">
                  <span className="inline-block text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                    Editor Completo
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Pode <strong>criar, editar e excluir</strong> RDOs, registrar fotos, clima, mão de obra e gerenciar canteiros.
                  </p>
                </div>
              </div>

              {/* Option 2: Visualizador (Somente Leitura) */}
              <div 
                onClick={() => setPerfil('visualizador')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  perfil === 'visualizador'
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span>Visualizador</span>
                  </div>
                  {perfil === 'visualizador' && (
                    <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-2.5">
                  <span className="inline-block text-[10px] font-bold uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                    Somente Leitura
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Apenas <strong>visualiza relatórios e emite PDFs</strong>. Ideal para fiscais, clientes, auditores e diretoria.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* DADOS BÁSICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenheiro André Santos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Função Técnica *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Encarregado de Obras, Fiscal do Cliente"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail de Login *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="nome@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha / PIN Provisório
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Defina uma senha ou PIN"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp (para envio de relatórios e credenciais)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* OBRAS PERMITIDAS */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Obras Autorizadas para este Usuário
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={todasObras}
                  onChange={(e) => setTodasObras(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>Acesso a Todas as Obras</span>
              </label>
            </div>

            {!todasObras && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                <span className="text-[11px] text-slate-500 block">
                  Marque as obras que este usuário poderá acompanhar:
                </span>
                {obras.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma obra cadastrada.</p>
                ) : (
                  <div className="space-y-1.5">
                    {obras.map((obra) => {
                      const isSelected = obrasSelecionadas.includes(obra.id);
                      return (
                        <label
                          key={obra.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-amber-100/60 font-semibold text-slate-900' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleObra(obra.id)}
                            className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                          />
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{obra.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STATUS ATIVO / INATIVO */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Status do Acesso</span>
              <span className="text-[11px] text-slate-500">
                {ativo ? 'Usuário ativo e autorizado a acessar o sistema' : 'Acesso bloqueado temporariamente'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                ativo 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {ativo ? '✓ Acesso Ativo' : '✕ Bloqueado'}
            </button>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
            >
              {editingUsuario ? 'Salvar Alterações' : 'Concluir Cadastro de Login'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
