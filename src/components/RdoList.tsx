import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Share2, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  Camera, 
  AlertTriangle, 
  CloudSun, 
  Building2,
  Filter,
  CalendarRange
} from 'lucide-react';
import { RelatorioDiarioObra, Obra } from '../types';

interface RdoListProps {
  rdos: RelatorioDiarioObra[];
  obras: Obra[];
  onNewRdo: () => void;
  onViewRdo: (rdo: RelatorioDiarioObra) => void;
  onEditRdo: (rdo: RelatorioDiarioObra) => void;
  onDeleteRdo: (id: string) => void;
  onDownloadPdf: (rdo: RelatorioDiarioObra) => void;
  onShareRdo: (rdo: RelatorioDiarioObra) => void;
  onNavigatePeriodos?: () => void;
  initialObraFilter?: string;
}

export const RdoList: React.FC<RdoListProps> = ({
  rdos,
  obras,
  onNewRdo,
  onViewRdo,
  onEditRdo,
  onDeleteRdo,
  onDownloadPdf,
  onShareRdo,
  onNavigatePeriodos,
  initialObraFilter = 'todas'
}) => {
  const [selectedObraId, setSelectedObraId] = useState<string>(initialObraFilter);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRdos = rdos.filter(rdo => {
    const matchesObra = selectedObraId === 'todas' || rdo.obraId === selectedObraId;
    
    const obraNome = obras.find(o => o.id === rdo.obraId)?.nome || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      String(rdo.numero).includes(term) ||
      rdo.data.includes(term) ||
      obraNome.toLowerCase().includes(term) ||
      rdo.elaboradoPor.toLowerCase().includes(term) ||
      rdo.responsavelTecnico.toLowerCase().includes(term) ||
      (rdo.atividades && rdo.atividades.some(a => a.descricao.toLowerCase().includes(term) || a.etapa.toLowerCase().includes(term)));

    return matchesObra && matchesSearch;
  });

  const getObra = (obraId: string) => obras.find(o => o.id === obraId);

  const getClimaIcon = (c?: string) => {
    switch (c) {
      case 'claro_ensolarado': return '☀️';
      case 'parcialmente_nublado': return '⛅';
      case 'nublado': return '☁️';
      case 'chuva_fraca': return '🌧️';
      case 'chuva_forte': return '⛈️';
      default: return '☀️';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Diários de Obras (RDO)</h2>
          <p className="text-xs text-slate-500">Histórico completo de registros diários, fotos, mão de obra e exportações em PDF</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigatePeriodos && (
            <button
              onClick={onNavigatePeriodos}
              className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all"
            >
              <CalendarRange className="w-4 h-4 text-amber-600" />
              <span>Filtrar por Período</span>
            </button>
          )}
          <button
            onClick={onNewRdo}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Emitir Novo RDO
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nº RDO, data, serviço, obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filtrar por Obra:</span>
          <select
            value={selectedObraId}
            onChange={(e) => setSelectedObraId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 max-w-xs truncate focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          >
            <option value="todas">Todas as Obras ({rdos.length} diários)</option>
            {obras.map(obra => {
              const count = rdos.filter(r => r.obraId === obra.id).length;
              return (
                <option key={obra.id} value={obra.id}>
                  {obra.nome} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* RDOs List */}
      {filteredRdos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum diário de obra encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm ? 'Nenhum RDO corresponde aos termos pesquisados.' : 'Cadastre o primeiro RDO para documentar os serviços executados no dia e emitir o PDF.'}
          </p>
          <button
            onClick={onNewRdo}
            className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
          >
            <Plus className="w-4 h-4" /> Emitir Novo RDO
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRdos.map(rdo => {
            const obra = getObra(rdo.obraId);
            const dataBR = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';
            const totalMO = rdo.maoDeObra ? rdo.maoDeObra.reduce((a, b) => a + Number(b.quantidade || 0), 0) : 0;
            const totalFotos = rdo.fotos?.length || 0;
            const ocorrenciasCount = rdo.ocorrencias?.length || 0;

            return (
              <div 
                key={rdo.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-2xs hover:shadow-xs transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">RDO</span>
                    <span className="text-sm font-black tracking-tight">#{String(rdo.numero).padStart(3, '0')}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {obra?.nome || 'Obra não informada'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {rdo.diaSemana}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dataBR}
                      </span>
                      <span>• Dia {rdo.diasDecorridos || '-'}</span>
                      <span className="flex items-center gap-1">
                        <span>{getClimaIcon(rdo.clima?.manha)}</span>
                        <span>{rdo.clima?.praticabilidade === 'praticavel' ? 'Praticável' : 'Chuva / Parc.'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {totalMO} operários
                      </span>
                      {totalFotos > 0 && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Camera className="w-3.5 h-3.5" /> {totalFotos} fotos
                        </span>
                      )}
                      {ocorrenciasCount > 0 && (
                        <span className="flex items-center gap-1 text-rose-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> {ocorrenciasCount} ocorrência(s)
                        </span>
                      )}
                    </div>

                    {/* Quick description of first activity */}
                    {rdo.atividades && rdo.atividades.length > 0 && (
                      <p className="text-xs text-slate-600 line-clamp-1 pt-0.5">
                        <strong className="text-slate-700">{rdo.atividades[0].etapa}:</strong> {rdo.atividades[0].descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                  <button
                    onClick={() => onViewRdo(rdo)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Visualizar Diário Completo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>

                  <button
                    onClick={() => onDownloadPdf(rdo)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Baixar Relatório em PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF</span>
                  </button>

                  <button
                    onClick={() => onShareRdo(rdo)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Compartilhar com Cliente"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEditRdo(rdo)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar RDO"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o RDO Nº ${rdo.numero}?`)) {
                        onDeleteRdo(rdo.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir RDO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
