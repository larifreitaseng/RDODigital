export type StatusObra = 'em_andamento' | 'paralisada' | 'concluida' | 'planejamento';

export interface Obra {
  id: string;
  nome: string;
  cliente: string;
  endereco: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  previsaoTermino: string;
  responsavelTecnico: string;
  creaCau: string;
  status: StatusObra;
  progressoEstimado: number; // 0 - 100
  etapas: string[];
  orcamentoTotal?: number;
  observacoes?: string;
}

export type TipoColaborador = 'proprio' | 'terceirizado';

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  tipo: TipoColaborador;
  empresa: string;
  telefone?: string;
  ativo: boolean;
  cpf?: string;
}

export type SituacaoEquipamento = 'proprio' | 'locado';
export type StatusEquipamento = 'operando' | 'parado' | 'manutencao';

export interface Equipamento {
  id: string;
  nome: string;
  categoria: string; // Ex: Terraplanagem, Betoneira, Transporte, Elevação
  quantidade: number;
  situacao: SituacaoEquipamento;
  fornecedor?: string;
  status: StatusEquipamento;
}

export type CondicaoTempo = 'claro_ensolarado' | 'parcialmente_nublado' | 'nublado' | 'chuva_fraca' | 'chuva_forte';
export type Praticabilidade = 'praticavel' | 'parcialmente_praticavel' | 'impraticavel';

export interface CondicoesClimaticas {
  manha: CondicaoTempo;
  tarde: CondicaoTempo;
  noite: CondicaoTempo;
  praticabilidade: Praticabilidade;
  temperaturaMin?: number;
  temperaturaMax?: number;
  impactoChuvaHoras?: number;
  observacaoClima?: string;
}

export interface MaoDeObraAlocada {
  id: string;
  colaboradorId?: string;
  funcao: string;
  empresa: string;
  quantidade: number;
  horasTrabalhadas?: number;
  horasExtras?: number;
  temHoraExtra?: boolean;
}

export interface EquipamentoAlocado {
  id: string;
  equipamentoId?: string;
  nome: string;
  quantidade: number;
  status: StatusEquipamento;
  horasTrabalhadas: number;
}

export interface AtividadeEtapa {
  id: string;
  etapa: string;
  descricao: string;
  progressoPercentual?: number;
  localizacao?: string; // ex: 2º Pavimento, Bloco A
}

export type SeveridadeOcorrencia = 'baixa' | 'media' | 'alta';
export type TipoOcorrencia = 'acidente' | 'material' | 'fornecedor' | 'visita_tecnica' | 'fiscalizacao' | 'projeto' | 'outro';

export interface Ocorrencia {
  id: string;
  tipo: TipoOcorrencia;
  titulo: string;
  descricao: string;
  severidade: SeveridadeOcorrencia;
  acaoTomada: string;
  resolvida: boolean;
}

export interface FotoRDO {
  id: string;
  url: string;
  legenda: string;
  etapa?: string;
  horario?: string;
}

export interface RelatorioDiarioObra {
  id: string;
  numero: number; // Ex: 1, 2, 3...
  obraId: string;
  data: string; // YYYY-MM-DD
  diaSemana: string;
  diasDecorridos: number;
  
  // Informações Técnicas e Responsáveis
  elaboradoPor: string;
  responsavelTecnico: string;
  creaCau: string;
  vistoFiscalizacao?: string;

  // Seções do RDO
  clima: CondicoesClimaticas;
  maoDeObra: MaoDeObraAlocada[];
  equipamentos: EquipamentoAlocado[];
  atividades: AtividadeEtapa[];
  ocorrencias: Ocorrencia[];
  fotos: FotoRDO[];
  
  // Comentários gerais do dia
  observacoesGerais?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type PerfilUsuario = 'editor' | 'visualizador';

export interface UsuarioEquipe {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  cargo: string; // Ex: Engenheiro Residente, Encarregado de Obras, Fiscal Técnico, Arquiteto, Cliente / Proprietário
  perfil: PerfilUsuario; // 'editor' (pode criar, modificar e excluir) ou 'visualizador' (apenas visualização e relatórios)
  obrasPermitidas: string[]; // IDs das obras autorizadas ou ['todas']
  ativo: boolean;
  telefone?: string;
  ultimoAcesso?: string;
  dataCadastro: string;
  fotoUrl?: string;
}
