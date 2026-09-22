import React from 'react';
import { 
  Building2, 
  FileText, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Download, 
  Share2, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Sun
} from 'lucide-react';
import { Obra, RelatorioDiarioObra, Colaborador } from '../types';

interface DashboardOverviewProps {
  obras: Obra[];
  rdos: RelatorioDiarioObra[];
  colaboradores: Colaborador[];
  onSelectTab: (tab: any) => void;
  onNewRdo: () => void;
  onNewObra: () => void;
  onViewRdo: (rdo: RelatorioDiarioObra) => void;
  onDownloadPdf: (rdo: RelatorioDiarioObra) => void;
  onShareRdo: (rdo: RelatorioDiarioObra) => void;
  canEdit?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  obras,
  rdos,
  colaboradores,
  onSelectTab,
  onNewRdo,
  onNewObra,
  onViewRdo,
  onDownloadPdf,
  onShareRdo,
  canEdit = true
}) => {
  const obrasAtivas = obras.filter(o => o.status === 'em_andamento').length;
  
  // Total colaboradores count
  const totalColaboradores = colaboradores.filter(c => c.ativo).length;

  // Total ocorrencias em aberto nos RDOs
  const ocorrenciasAbertas = rdos.reduce((count, r) => {
    return count + (r.ocorrencias ? r.ocorrencias.filter(o => !o.resolvida).length : 0);
  }, 0);

  // Latest RDOs (sorted by date or creation)
  const recentRdos = [...rdos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);

  const getObraNome = (obraId: string) => {
    return obras.find(o => o.id === obraId)?.nome || 'Obra não especificada';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner e Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-700 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
              <Sun className="w-3.5 h-3.5" /> Controle Diário de Obras
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Painel de Gestão e Relatórios Diários
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Registre a rotina de canteiro, mão de obra, maquinário, fotos e gere relatórios diários em PDF padronizados para envio imediato aos clientes e fiscais.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {canEdit ? (
              <>
                <button
                  id="btn-dash-novo-rdo"
                  onClick={onNewRdo}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Emitir Novo RDO
                </button>
                <button
                  id="btn-dash-nova-obra"
                  onClick={onNewObra}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  Cadastrar Obra
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn-dash-ver-rdos"
                  onClick={() => onSelectTab('rdos')}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Consultar Diários (RDO)
                </button>
                <button
                  id="btn-dash-fazer-login"
                  onClick={() => onSelectTab('usuarios')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
                >
                  <Users className="w-4 h-4" />
                  Fazer Login / Entrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div 
          onClick={() => onSelectTab('obras')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Obras em Andamento</span>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{obrasAtivas}</span>
            <span className="text-xs text-slate-500">de {obras.length} cadastradas</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1 font-medium">
            Ver todas as obras <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => onSelectTab('rdos')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relatórios Emitidos</span>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{rdos.length}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Arquivados e Prontos
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 font-medium">
            Acessar histórico de RDOs <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => onSelectTab('colaboradores')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Equipe e Colaboradores</span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalColaboradores}</span>
            <span className="text-xs text-slate-500">ativos no cadastro</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
            Gerenciar mão de obra <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => onSelectTab('rdos')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ocorrências Abertas</span>
            <div className={`p-2.5 rounded-lg transition-colors ${
              ocorrenciasAbertas > 0 
                ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' 
                : 'bg-slate-50 text-slate-600 group-hover:bg-slate-700 group-hover:text-white'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${ocorrenciasAbertas > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {ocorrenciasAbertas}
            </span>
            <span className="text-xs text-slate-500">em acompanhamento</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
            {ocorrenciasAbertas === 0 ? 'Sem pendências críticas' : 'Atenção necessária'}
          </div>
        </div>

      </div>

      {/* Main Grid: Recent RDOs e Active Works Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent RDOs (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Últimos Relatórios Emitidos</h2>
              <p className="text-xs text-slate-500">Diários de obra recentes prontos para visualização e PDF</p>
            </div>
            <button
              onClick={() => onSelectTab('rdos')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Ver todos ({rdos.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRdos.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Nenhum relatório emitido ainda</p>
              <p className="text-xs text-slate-400 mt-1">Crie o primeiro diário de obra para gerar seu PDF.</p>
              <button
                onClick={onNewRdo}
                className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Criar Primeiro RDO
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {recentRdos.map((rdo) => {
                const dataBR = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';
                const totalMO = rdo.maoDeObra ? rdo.maoDeObra.reduce((a, b) => a + Number(b.quantidade || 0), 0) : 0;
                const totalFotos = rdo.fotos?.length || 0;

                return (
                  <div key={rdo.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-700 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500">RDO</span>
                        <span className="text-xs font-extrabold text-amber-600">#{String(rdo.numero).padStart(2, '0')}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {getObraNome(rdo.obraId)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dataBR} ({rdo.diaSemana})
                          </span>
                          <span>• {totalMO} trabalhadores</span>
                          {totalFotos > 0 && <span>• {totalFotos} fotos</span>}
                          {rdo.ocorrencias && rdo.ocorrencias.length > 0 && (
                            <span className="text-rose-600 font-medium">
                              • {rdo.ocorrencias.length} ocorrência(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => onViewRdo(rdo)}
                        title="Ver Relatório Completo"
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                      <button
                        onClick={() => onDownloadPdf(rdo)}
                        title="Baixar PDF Oficial"
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => onShareRdo(rdo)}
                        title="Compartilhar com Cliente"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Obras Summary (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Obras em Acompanhamento</h2>
              <button
                onClick={onNewObra}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                + Nova
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {obras.map(obra => {
                const countRdos = rdos.filter(r => r.obraId === obra.id).length;
                return (
                  <div key={obra.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{obra.nome}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                        {obra.status === 'em_andamento' ? 'Em Obra' : obra.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{obra.cliente}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                        <span>Avanço Físico</span>
                        <span className="font-bold text-slate-900">{obra.progressoEstimado}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${obra.progressoEstimado}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> {countRdos} diários emitidos
                      </span>
                      <span>Resp: {obra.responsavelTecnico.split(' ')[0]} {obra.responsavelTecnico.split(' ')[1] || ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
            <p className="text-xs font-semibold text-amber-900">💡 Dica de Obra:</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              O RDO assinado e com fotos comprova o histórico de serviços, paralisações por chuva e atende às exigências de normas do CREA/CAU e da fiscalização.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
