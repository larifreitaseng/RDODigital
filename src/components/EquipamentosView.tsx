import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  X
} from 'lucide-react';
import { Equipamento, SituacaoEquipamento, StatusEquipamento } from '../types';

interface EquipamentosViewProps {
  equipamentos: Equipamento[];
  onSaveEquipamento: (equipamento: Equipamento) => void;
  onDeleteEquipamento: (id: string) => void;
  canEdit?: boolean;
}

export const EquipamentosView: React.FC<EquipamentosViewProps> = ({
  equipamentos,
  onSaveEquipamento,
  onDeleteEquipamento,
  canEdit = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<Equipamento | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [situacao, setSituacao] = useState<SituacaoEquipamento>('proprio');
  const [fornecedor, setFornecedor] = useState('');
  const [status, setStatus] = useState<StatusEquipamento>('operando');

  const openModal = (equip?: Equipamento) => {
    if (equip) {
      setEditingEquip(equip);
      setNome(equip.nome);
      setCategoria(equip.categoria);
      setQuantidade(equip.quantidade);
      setSituacao(equip.situacao);
      setFornecedor(equip.fornecedor || '');
      setStatus(equip.status);
    } else {
      setEditingEquip(null);
      setNome('');
      setCategoria('Equipamentos Gerais');
      setQuantidade(1);
      setSituacao('proprio');
      setFornecedor('');
      setStatus('operando');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEquip(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe a identificação ou modelo do equipamento.');
      return;
    }

    const newEquip: Equipamento = {
      id: editingEquip ? editingEquip.id : `eq-${Date.now()}`,
      nome: nome.trim(),
      categoria: categoria.trim() || 'Equipamentos Gerais',
      quantidade: Math.max(1, Number(quantidade) || 1),
      situacao,
      fornecedor: fornecedor.trim(),
      status
    };

    onSaveEquipamento(newEquip);
    closeModal();
  };

  const filtered = equipamentos.filter(e => {
    const matchesSearch = 
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.fornecedor && e.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSituacao = filtroSituacao === 'todos' || e.situacao === filtroSituacao;
    return matchesSearch && matchesSituacao;
  });

  const getStatusBadge = (st: StatusEquipamento) => {
    switch (st) {
      case 'operando':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Operando
          </span>
        );
      case 'parado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Parado
          </span>
        );
      case 'manutencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Manutenção
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Equipamentos e Maquinário do Canteiro</h2>
          <p className="text-xs text-slate-500">Controle de máquinas leves, pesadas, ferramentas e andaimes presentes na obra</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Cadastrar Equipamento
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por equipamento, categoria ou locadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Situação:</span>
          <select
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          >
            <option value="todos">Todos ({equipamentos.length})</option>
            <option value="proprio">Próprios</option>
            <option value="locado">Locados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Equipamento / Modelo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4">Fornecedor / Locadora</th>
                <th className="py-3 px-4">Status de Operação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum equipamento cadastrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map(equip => (
                  <tr key={equip.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span>{equip.nome}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{equip.categoria}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{equip.quantidade}</td>
                    <td className="py-3.5 px-4">
                      {equip.situacao === 'proprio' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Próprio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Locado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{equip.fornecedor || '-'}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(equip.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(equip)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover "${equip.nome}"?`)) {
                                onDeleteEquipamento(equip.id);
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                {editingEquip ? 'Editar Equipamento' : 'Novo Equipamento / Máquina'}
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
                  Nome / Modelo do Equipamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Betoneira 400L, Andaime Fachadeiro..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Concretagem, Elevação..."
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origem
                  </label>
                  <select
                    value={situacao}
                    onChange={(e) => setSituacao(e.target.value as SituacaoEquipamento)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="proprio">Próprio</option>
                    <option value="locado">Locado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Atual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusEquipamento)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="operando">Operando normalmente</option>
                    <option value="parado">Parado no canteiro</option>
                    <option value="manutencao">Em manutenção</option>
                  </select>
                </div>
              </div>

              {situacao === 'locado' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor / Empresa Locadora
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LocaMax Andaimes e Máquinas"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

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
                  {editingEquip ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
