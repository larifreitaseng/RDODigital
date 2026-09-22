import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Trash2, CheckCircle, Calendar, User, MapPin } from 'lucide-react';
import { Obra, StatusObra } from '../types';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obra: Obra) => void;
  editingObra?: Obra | null;
}

export const ETAPAS_PADRAO = [
  'Serviços Preliminares e Canteiro',
  'Demolição e Terraplenagem',
  'Fundações e Contenções',
  'Estrutura de Concreto Armado',
  'Estrutura Metálica',
  'Alvenaria e Vedações',
  'Contrapiso e Regularização de Piso',
  'Instalações Hidráulicas e Sanitárias',
  'Instalações Elétricas e Dados',
  'Instalações de Climatização e Ventilação',
  'Impermeabilização e Isolamento',
  'Revestimentos Internos e Pisos',
  'Fachada e Pintura Externa',
  'Gesso e Drywall (Forros e Divisórias)',
  'Esquadrias de Madeira (Portas e Batentes)',
  'Esquadrias de Alumínio e Vidros',
  'Esquadrias de Ferro e Serralheria',
  'Louças e Metais Sanitários',
  'Marmoraria e Granitos',
  'Pintura Interna e Emassamento',
  'Cobertura e Telhado',
  'Paisagismo e Pavimentação Externa',
  'Limpeza Final e Vistoria de Entrega'
];

export const ObraModal: React.FC<ObraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingObra
}) => {
  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [dataInicio, setDataInicio] = useState('');
  const [previsaoTermino, setPrevisaoTermino] = useState('');
  const [responsavelTecnico, setResponsavelTecnico] = useState('');
  const [creaCau, setCreaCau] = useState('');
  const [status, setStatus] = useState<StatusObra>('em_andamento');
  const [progressoEstimado, setProgressoEstimado] = useState(0);
  const [orcamentoTotal, setOrcamentoTotal] = useState<number | undefined>(undefined);
  const [observacoes, setObservacoes] = useState('');
  const [etapas, setEtapas] = useState<string[]>(ETAPAS_PADRAO);
  const [novaEtapa, setNovaEtapa] = useState('');

  useEffect(() => {
    if (editingObra) {
      setNome(editingObra.nome);
      setCliente(editingObra.cliente);
      setEndereco(editingObra.endereco);
      setCidade(editingObra.cidade);
      setEstado(editingObra.estado);
      setDataInicio(editingObra.dataInicio);
      setPrevisaoTermino(editingObra.previsaoTermino);
      setResponsavelTecnico(editingObra.responsavelTecnico);
      setCreaCau(editingObra.creaCau);
      setStatus(editingObra.status);
      setProgressoEstimado(editingObra.progressoEstimado);
      setOrcamentoTotal(editingObra.orcamentoTotal);
      setObservacoes(editingObra.observacoes || '');
      setEtapas(editingObra.etapas && editingObra.etapas.length > 0 ? editingObra.etapas : ETAPAS_PADRAO);
    } else {
      setNome('');
      setCliente('');
      setEndereco('');
      setCidade('');
      setEstado('SP');
      setDataInicio(new Date().toISOString().split('T')[0]);
      setPrevisaoTermino('');
      setResponsavelTecnico('');
      setCreaCau('');
      setStatus('em_andamento');
      setProgressoEstimado(0);
      setOrcamentoTotal(undefined);
      setObservacoes('');
      setEtapas(ETAPAS_PADRAO);
    }
  }, [editingObra, isOpen]);

  if (!isOpen) return null;

  const handleAddEtapa = () => {
    if (!novaEtapa.trim()) return;
    setEtapas([...etapas, novaEtapa.trim()]);
    setNovaEtapa('');
  };

  const handleRemoveEtapa = (index: number) => {
    setEtapas(etapas.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cliente.trim() || !responsavelTecnico.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Nome da Obra, Cliente e Responsável Técnico).');
      return;
    }

    const obraData: Obra = {
      id: editingObra ? editingObra.id : `obra-${Date.now()}`,
      nome: nome.trim(),
      cliente: cliente.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      dataInicio,
      previsaoTermino,
      responsavelTecnico: responsavelTecnico.trim(),
      creaCau: creaCau.trim(),
      status,
      progressoEstimado: Number(progressoEstimado) || 0,
      orcamentoTotal: orcamentoTotal ? Number(orcamentoTotal) : undefined,
      observacoes: observacoes.trim(),
      etapas
    };

    onSave(obraData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingObra ? 'Editar Cadastro da Obra' : 'Cadastrar Nova Obra'}
              </h3>
              <p className="text-xs text-slate-500">Dados técnicos da construção para emissão dos diários (RDO)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          
          {/* Identificação Geral */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              1. Identificação da Obra e Cliente
            </h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Obra / Empreendimento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Edifício Residencial Solar dos Ipês"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente / Contratante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Horizon Ltda"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Obra
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusObra)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="em_andamento">Em Andamento</option>
                  <option value="planejamento">Planejamento</option>
                  <option value="paralisada">Paralisada</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço da Obra
              </label>
              <input
                type="text"
                placeholder="Rua, Número, Bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Responsabilidade Técnica */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              2. Responsabilidade Técnica e Prazos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Engenheiro / Responsável Técnico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Eng. Carlos Martins"
                  value={responsavelTecnico}
                  onChange={(e) => setResponsavelTecnico(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registro Profissional (CREA / CAU)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CREA-SP 5062491823"
                  value={creaCau}
                  onChange={(e) => setCreaCau(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Previsão de Término</label>
                <input
                  type="date"
                  value={previsaoTermino}
                  onChange={(e) => setPrevisaoTermino(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Avanço Geral (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressoEstimado}
                    onChange={(e) => setProgressoEstimado(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Etapas da Obra */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>3. Etapas Construtivas Cadastradas</span>
              <span className="text-[11px] lowercase text-slate-400 font-normal">vinculadas aos relatórios</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar nova etapa (ex: Pavimentação externa)"
                value={novaEtapa}
                onChange={(e) => setNovaEtapa(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEtapa(); } }}
                className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddEtapa}
                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {etapas.map((etapa, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                >
                  {etapa}
                  <button
                    type="button"
                    onClick={() => handleRemoveEtapa(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Gerais da Obra
            </label>
            <textarea
              rows={2}
              placeholder="Escopo resumido, particularidades técnicas, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {editingObra ? 'Atualizar Obra' : 'Cadastrar Obra'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
