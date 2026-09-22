import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  Edit, 
  Trash2, 
  Layers, 
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Obra, RelatorioDiarioObra } from '../types';

interface ObrasListProps {
  obras: Obra[];
  rdos: RelatorioDiarioObra[];
  onNewObra: () => void;
  onEditObra: (obra: Obra) => void;
  onDeleteObra: (id: string) => void;
  onNewRdoForObra: (obraId: string) => void;
  onFilterRdosByObra: (obraId: string) => void;
}

export const ObrasList: React.FC<ObrasListProps> = ({
  obras,
  rdos,
  onNewObra,
  onEditObra,
  onDeleteObra,
  onNewRdoForObra,
  onFilterRdosByObra
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredObras = obras.filter(o => {
    const matchesSearch = 
      o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.responsavelTecnico.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Em Andamento</span>;
      case 'planejamento':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Planejamento</span>;
      case 'paralisada':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Paralisada</span>;
      case 'concluida':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Concluída</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Search and New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cadastro de Obras</h2>
          <p className="text-xs text-slate-500">Gerenciamento de canteiros, contratos e etapas construtivas</p>
        </div>
        <button
          onClick={onNewObra}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Cadastrar Nova Obra
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cliente, engenheiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          >
            <option value="todos">Todos ({obras.length})</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="planejamento">Planejamento</option>
            <option value="paralisada">Paralisada</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
      </div>

      {/* Obras Grid */}
      {filteredObras.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma obra encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm ? 'Tente ajustar os termos de pesquisa ou filtros.' : 'Comece cadastrando sua primeira obra para emitir relatórios diários de acompanhamento.'}
          </p>
          <button
            onClick={onNewObra}
            className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
          >
            <Plus className="w-4 h-4" /> Cadastrar Obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredObras.map(obra => {
            const obraRdos = rdos.filter(r => r.obraId === obra.id);
            const dataIniBR = obra.dataInicio ? obra.dataInicio.split('-').reverse().join('/') : '-';
            const dataFimBR = obra.previsaoTermino ? obra.previsaoTermino.split('-').reverse().join('/') : '-';

            return (
              <div 
                key={obra.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight hover:text-amber-700 transition-colors">
                          {obra.nome}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{obra.cliente}</span>
                      </div>
                    </div>
                    {getStatusBadge(obra.status)}
                  </div>

                  {/* Location e Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{obra.endereco ? `${obra.endereco} - ${obra.cidade}/${obra.estado}` : `${obra.cidade}/${obra.estado}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">Resp. Técnico: <strong className="text-slate-800">{obra.responsavelTecnico}</strong> ({obra.creaCau || 'Sem registro'})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Início: <strong>{dataIniBR}</strong> • Término: <strong>{dataFimBR}</strong></span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Avanço Físico Global
                      </span>
                      <span className="text-slate-900 font-bold">{obra.progressoEstimado}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${obra.progressoEstimado}%` }}
                      />
                    </div>
                  </div>

                  {/* Etapas badges preview */}
                  {obra.etapas && obra.etapas.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 overflow-hidden">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-600 shrink-0">{obra.etapas.length} Etapas:</span>
                      <span className="truncate text-slate-500">
                        {obra.etapas.slice(0, 3).join(', ')}{obra.etapas.length > 3 ? ` +${obra.etapas.length - 3}` : ''}
                      </span>
                    </div>
                  )}

                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onFilterRdosByObra(obra.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{obraRdos.length} Diários (RDO)</span>
                    </button>
                    <button
                      onClick={() => onNewRdoForObra(obra.id)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo RDO
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditObra(obra)}
                      title="Editar cadastro"
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a obra "${obra.nome}" e seus relatórios vinculados?`)) {
                          onDeleteObra(obra.id);
                        }
                      }}
                      title="Excluir obra"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
