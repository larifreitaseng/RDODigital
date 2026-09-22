import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Briefcase, 
  Phone, 
  Check, 
  X,
  HardHat
} from 'lucide-react';
import { Colaborador, TipoColaborador } from '../types';

interface ColaboradoresViewProps {
  colaboradores: Colaborador[];
  onSaveColaborador: (colaborador: Colaborador) => void;
  onDeleteColaborador: (id: string) => void;
  canEdit?: boolean;
}

export const ColaboradoresView: React.FC<ColaboradoresViewProps> = ({
  colaboradores,
  onSaveColaborador,
  onDeleteColaborador,
  canEdit = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  const [tipo, setTipo] = useState<TipoColaborador>('proprio');
  const [empresa, setEmpresa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [cpf, setCpf] = useState('');

  const openModal = (colab?: Colaborador) => {
    if (colab) {
      setEditingColaborador(colab);
      setNome(colab.nome);
      setFuncao(colab.funcao);
      setTipo(colab.tipo);
      setEmpresa(colab.empresa);
      setTelefone(colab.telefone || '');
      setAtivo(colab.ativo);
      setCpf(colab.cpf || '');
    } else {
      setEditingColaborador(null);
      setNome('');
      setFuncao('');
      setTipo('proprio');
      setEmpresa('Construtora Principal');
      setTelefone('');
      setAtivo(true);
      setCpf('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingColaborador(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !funcao.trim()) {
      alert('Preencha o Nome e a Função do colaborador.');
      return;
    }

    const newColab: Colaborador = {
      id: editingColaborador ? editingColaborador.id : `col-${Date.now()}`,
      nome: nome.trim(),
      funcao: funcao.trim(),
      tipo,
      empresa: empresa.trim() || (tipo === 'proprio' ? 'Própria' : 'Subempreiteira'),
      telefone: telefone.trim(),
      ativo,
      cpf: cpf.trim()
    };

    onSaveColaborador(newColab);
    closeModal();
  };

  const toggleStatus = (colab: Colaborador) => {
    onSaveColaborador({
      ...colab,
      ativo: !colab.ativo
    });
  };

  const filtered = colaboradores.filter(c => {
    const matchesSearch = 
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.funcao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchesSearch && matchesTipo;
  });

  const totalProprios = colaboradores.filter(c => c.tipo === 'proprio' && c.ativo).length;
  const totalTerceiros = colaboradores.filter(c => c.tipo === 'terceirizado' && c.ativo).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão dos Colaboradores e Mão de Obra</h2>
          <p className="text-xs text-slate-500">Cadastre operários, encarregados, engenheiros e subempreiteiros para alocação no RDO</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Cadastrar Colaborador
          </button>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Cadastrado</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{colaboradores.length}</div>
          <span className="text-xs text-slate-400">Pessoas e frentes de trabalho</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Equipe Própria Ativa</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalProprios}</div>
          <span className="text-xs text-slate-400">Contratação direta / CLT</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 uppercase">Terceirizados Ativos</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{totalTerceiros}</div>
          <span className="text-xs text-slate-400">Subempreiteiras e serviços</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, função ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Tipo:</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          >
            <option value="todos">Todos ({colaboradores.length})</option>
            <option value="proprio">Próprio CLT</option>
            <option value="terceirizado">Terceirizado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Nome / Equipe</th>
                <th className="py-3 px-4">Função / Especialidade</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum colaborador encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map(colab => (
                  <tr key={colab.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <HardHat className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div>{colab.nome}</div>
                        {colab.cpf && <div className="text-[10px] text-slate-400 font-normal">CPF: {colab.cpf}</div>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{colab.funcao}</td>
                    <td className="py-3.5 px-4">
                      {colab.tipo === 'proprio' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Próprio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Terceirizado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{colab.empresa}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {colab.telefone ? (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" /> {colab.telefone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {canEdit ? (
                        <button
                          onClick={() => toggleStatus(colab)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            colab.ativo 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title="Clique para alternar status"
                        >
                          {colab.ativo ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Ativo
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Inativo
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          colab.ativo 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {colab.ativo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {colab.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(colab)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir "${colab.nome}"?`)) {
                                onDeleteColaborador(colab.id);
                              }
                            }}
                            title="Excluir"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating / Editing Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador / Equipe'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo ou Nome da Frente de Trabalho *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva ou Equipe de Armadores"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Função / Especialidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mestre de Obras, Pedreiro..."
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vínculo / Tipo
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoColaborador)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="proprio">Próprio (CLT)</option>
                    <option value="terceirizado">Terceirizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa Empregadora / Subempreiteira
                </label>
                <input
                  type="text"
                  placeholder="Ex: Construtora Principal ou AçoForte Eireli"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chk-ativo" className="text-xs font-medium text-slate-700">
                  Colaborador ativo para alocação nos relatórios
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all"
                >
                  {editingColaborador ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
