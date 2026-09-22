import { Obra, Colaborador, Equipamento, RelatorioDiarioObra, UsuarioEquipe } from '../types';

export const INITIAL_OBRAS: Obra[] = [
  {
    id: 'obra-1',
    nome: 'Edifício Residencial Horizon Tower',
    cliente: 'Horizon Empreendimentos Imobiliários S.A.',
    endereco: 'Av. Paulista, 2450 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    dataInicio: '2026-02-01',
    previsaoTermino: '2027-08-30',
    responsavelTecnico: 'Eng. Carlos Eduardo Martins',
    creaCau: 'CREA-SP 5062491823',
    status: 'em_andamento',
    progressoEstimado: 38,
    orcamentoTotal: 14500000,
    etapas: [
      'Serviços Preliminares e Canteiro',
      'Terraplanagem e Contenção',
      'Fundações Profundas',
      'Estrutura de Concreto Armado',
      'Alvenaria de Vedação',
      'Contrapiso e Regularização de Piso',
      'Instalações Hidráulicas e Sanitárias',
      'Instalações Elétricas e Dados',
      'Impermeabilização e Isolamento',
      'Revestimentos Internos e Pisos',
      'Fachada e Pintura Externa',
      'Gesso e Drywall (Forros e Divisórias)',
      'Esquadrias de Madeira (Portas e Batentes)',
      'Esquadrias de Ferro e Alumínio',
      'Louças e Metais Sanitários',
      'Marmoraria e Granitos',
      'Pintura Interna e Emassamento',
      'Limpeza Final e Vistoria de Entrega'
    ],
    observacoes: 'Edifício residencial com 18 pavimentos e 2 subsolos. Ritmo de obra dentro do cronograma físico-financeiro.'
  },
  {
    id: 'obra-2',
    nome: 'Centro Logístico Alpha Sul',
    cliente: 'Alpha Logística e Armazéns Ltda',
    endereco: 'Rodovia Raposo Tavares, km 32',
    cidade: 'Cotia',
    estado: 'SP',
    dataInicio: '2026-05-10',
    previsaoTermino: '2027-02-15',
    responsavelTecnico: 'Engª. Larissa Freitas',
    creaCau: 'CREA-SP 5078192044',
    status: 'em_andamento',
    progressoEstimado: 22,
    orcamentoTotal: 8200000,
    etapas: [
      'Terraplanagem e Drenagem',
      'Fundações e Blocos',
      'Estrutura Pré-moldada de Concreto',
      'Cobertura Metálica e Fechamentos',
      'Piso Industrial de Alta Resistência',
      'Instalações Especiais e Sprinklers',
      'Vias Internas e Pavimentação Asfáltica'
    ],
    observacoes: 'Galpão logístico de 12.000m² com docas niveladoras e pé direito livre de 12 metros.'
  }
];

export const INITIAL_COLABORADORES: Colaborador[] = [
  {
    id: 'col-1',
    nome: 'Carlos Eduardo Martins',
    funcao: 'Engenheiro Residente',
    tipo: 'proprio',
    empresa: 'Construtora Principal',
    telefone: '(11) 98765-4321',
    ativo: true,
    cpf: '234.567.890-11'
  },
  {
    id: 'col-2',
    nome: 'Antônio dos Santos (Tonho)',
    funcao: 'Mestre de Obras Geral',
    tipo: 'proprio',
    empresa: 'Construtora Principal',
    telefone: '(11) 97654-3210',
    ativo: true,
    cpf: '123.456.789-00'
  },
  {
    id: 'col-3',
    nome: 'Marcos Vinícius Silva',
    funcao: 'Técnico em Segurança do Trabalho',
    tipo: 'proprio',
    empresa: 'Construtora Principal',
    telefone: '(11) 96543-2109',
    ativo: true,
    cpf: '345.678.901-22'
  },
  {
    id: 'col-4',
    nome: 'Equipe de Pedreiros e Serventes',
    funcao: 'Pedreiro / Alvenaria',
    tipo: 'proprio',
    empresa: 'Construtora Principal',
    ativo: true
  },
  {
    id: 'col-5',
    nome: 'AçoForte Estruturas Eireli',
    funcao: 'Armadores e Carpinteiros',
    tipo: 'terceirizado',
    empresa: 'AçoForte Subempreiteira',
    telefone: '(11) 91234-5678',
    ativo: true
  },
  {
    id: 'col-6',
    nome: 'VoltInstal Instalações Elétricas',
    funcao: 'Eletricistas Prediais',
    tipo: 'terceirizado',
    empresa: 'VoltInstal Engenharia',
    telefone: '(11) 93344-5566',
    ativo: true
  },
  {
    id: 'col-7',
    nome: 'HidroTubos Instalações Hidráulicas',
    funcao: 'Encanadores e Instaladores',
    tipo: 'terceirizado',
    empresa: 'HidroTubos Ltda',
    ativo: true
  }
];

export const INITIAL_EQUIPAMENTOS: Equipamento[] = [
  {
    id: 'eq-1',
    nome: 'Betoneira 400 Litros com Motor Trifásico',
    categoria: 'Concretagem',
    quantidade: 2,
    situacao: 'proprio',
    status: 'operando'
  },
  {
    id: 'eq-2',
    nome: 'Andaime Fachadeiro Normatizado (NR-18)',
    categoria: 'Acesso e Elevação',
    quantidade: 350,
    situacao: 'locado',
    fornecedor: 'LocaMax Andaimes',
    status: 'operando'
  },
  {
    id: 'eq-3',
    nome: 'Retroescavadeira CAT 416F2',
    categoria: 'Terraplanagem / Movimentação',
    quantidade: 1,
    situacao: 'locado',
    fornecedor: 'RentaMaq Máquinas Pesadas',
    status: 'operando'
  },
  {
    id: 'eq-4',
    nome: 'Guincho de Coluna 500kg com Cabo de Aço',
    categoria: 'Elevação de Materiais',
    quantidade: 2,
    situacao: 'proprio',
    status: 'operando'
  },
  {
    id: 'eq-5',
    nome: 'Martelete Rompedor Bosch 16kg',
    categoria: 'Demolição e Desbaste',
    quantidade: 3,
    situacao: 'proprio',
    status: 'operando'
  },
  {
    id: 'eq-6',
    nome: 'Vibrador de Imersão para Concreto 45mm',
    categoria: 'Concretagem',
    quantidade: 4,
    situacao: 'proprio',
    status: 'operando'
  }
];

export const INITIAL_RDOS: RelatorioDiarioObra[] = [
  {
    id: 'rdo-1',
    numero: 42,
    obraId: 'obra-1',
    data: '2026-09-15',
    diaSemana: 'Terça-feira',
    diasDecorridos: 226,
    elaboradoPor: 'Antônio dos Santos (Mestre de Obras)',
    responsavelTecnico: 'Eng. Carlos Eduardo Martins',
    creaCau: 'CREA-SP 5062491823',
    vistoFiscalizacao: 'Arq. Mariana Lemos (Fiscal do Cliente)',
    clima: {
      manha: 'claro_ensolarado',
      tarde: 'parcialmente_nublado',
      noite: 'claro_ensolarado',
      praticabilidade: 'praticavel',
      temperaturaMin: 18,
      temperaturaMax: 28,
      impactoChuvaHoras: 0,
      observacaoClima: 'Tempo seco e favorável para serviços de concretagem externa e alvenaria de fachada.'
    },
    maoDeObra: [
      { id: 'mo-1', funcao: 'Engenheiro Residente', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: 'mo-2', funcao: 'Mestre de Obras', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: 'mo-3', funcao: 'Técnico de Segurança', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: 'mo-4', funcao: 'Pedreiros de Alvenaria', empresa: 'Construtora Principal', quantidade: 6, temHoraExtra: true },
      { id: 'mo-5', funcao: 'Serventes de Obras', empresa: 'Construtora Principal', quantidade: 8, temHoraExtra: true },
      { id: 'mo-6', funcao: 'Carpinteiros / Armadores', empresa: 'AçoForte Subempreiteira', quantidade: 5, temHoraExtra: false },
      { id: 'mo-7', funcao: 'Eletricistas Prediais', empresa: 'VoltInstal Engenharia', quantidade: 3, temHoraExtra: false }
    ],
    equipamentos: [
      { id: 'eq-a', nome: 'Betoneira 400L', quantidade: 2, status: 'operando', horasTrabalhadas: 7 },
      { id: 'eq-b', nome: 'Guincho de Coluna 500kg', quantidade: 2, status: 'operando', horasTrabalhadas: 8 },
      { id: 'eq-c', nome: 'Vibrador de Imersão Concreto', quantidade: 2, status: 'operando', horasTrabalhadas: 5 },
      { id: 'eq-d', nome: 'Andaime Fachadeiro', quantidade: 1, status: 'operando', horasTrabalhadas: 8 }
    ],
    atividades: [
      {
        id: 'atv-1',
        etapa: 'Estrutura de Concreto Armado',
        localizacao: 'Laje do 7º Pavimento',
        descricao: 'Concretagem das vigas V701 a V712 e laje L701 com concreto usinado fck 35 MPa, volume total lançado de 38 m³. Desmoldagem lateral de pilares do 6º pavimento.',
        progressoPercentual: 85
      },
      {
        id: 'atv-2',
        etapa: 'Alvenaria de Vedação',
        localizacao: '4º Pavimento - Apartamentos 41 e 42',
        descricao: 'Execução de alvenaria com blocos cerâmicos furados 11,5x19x29cm e argamassa industrializada, assentamento até altura de verga.',
        progressoPercentual: 70
      },
      {
        id: 'atv-3',
        etapa: 'Instalações Hidráulicas e Elétricas',
        localizacao: '3º Pavimento',
        descricao: 'Passagem de tubulação de esgoto primário e secundário de PVC e caixas sifonadas nas prumadas P1 e P2.',
        progressoPercentual: 60
      }
    ],
    ocorrencias: [
      {
        id: 'oc-1',
        tipo: 'material',
        titulo: 'Atraso de 40 minutos no 3º caminhão betoneira',
        descricao: 'O terceiro caminhão betoneira da usina Supermix atrasou 40 minutos devido ao trânsito na Marginal Pinheiros. Slump test realizado no canteiro conforme norma (slump 12 ± 2 cm, aprovado).',
        severidade: 'baixa',
        acaoTomada: 'Conferido o tempo de pega inicial e procedida a concretagem sem perda de junta fria.',
        resolvida: true
      },
      {
        id: 'oc-2',
        tipo: 'visita_tecnica',
        titulo: 'Visita de Fiscalização do Cliente',
        descricao: 'Visita técnica da Arquiteta Mariana Lemos acompanhada pelo Eng. Carlos Martins para alinhamento dos pontos elétricos do decorado.',
        severidade: 'baixa',
        acaoTomada: 'Ata de reunião lavrada e assinada por ambas as partes.',
        resolvida: true
      }
    ],
    fotos: [
      {
        id: 'foto-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
        legenda: 'Concretagem da laje e vigas do 7º pavimento com bomba-lança.',
        etapa: 'Estrutura de Concreto Armado',
        horario: '10:30'
      },
      {
        id: 'foto-2',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        legenda: 'Conferência de armação de aço e espaçadores plásticos antes da concretagem.',
        etapa: 'Estrutura de Concreto Armado',
        horario: '08:45'
      },
      {
        id: 'foto-3',
        url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
        legenda: 'Execução de alvenaria de vedação no 4º pavimento com blocos cerâmicos.',
        etapa: 'Alvenaria de Vedação',
        horario: '14:15'
      }
    ],
    observacoesGerais: 'Dia produtivo e sem registro de acidentes de trabalho (DDS realizado às 07:00 com tema: Uso obrigatório do cinto tipo paraquedista em trabalhos em altura).',
    createdAt: '2026-09-15T17:45:00Z',
    updatedAt: '2026-09-15T18:10:00Z'
  },
  {
    id: 'rdo-2',
    numero: 43,
    obraId: 'obra-1',
    data: '2026-09-16',
    diaSemana: 'Quarta-feira',
    diasDecorridos: 227,
    elaboradoPor: 'Antônio dos Santos (Mestre de Obras)',
    responsavelTecnico: 'Eng. Carlos Eduardo Martins',
    creaCau: 'CREA-SP 5062491823',
    vistoFiscalizacao: 'Eng. Roberto Alves (Gerenciadora)',
    clima: {
      manha: 'claro_ensolarado',
      tarde: 'claro_ensolarado',
      noite: 'parcialmente_nublado',
      praticabilidade: 'praticavel',
      temperaturaMin: 19,
      temperaturaMax: 30,
      impactoChuvaHoras: 0,
      observacaoClima: 'Céu aberto o dia todo, condições ideais para cura úmida e fôrmas.'
    },
    maoDeObra: [
      { id: 'mo-21', funcao: 'Engenheiro Residente', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: 'mo-22', funcao: 'Mestre de Obras', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: 'mo-23', funcao: 'Pedreiros', empresa: 'Construtora Principal', quantidade: 7, temHoraExtra: false },
      { id: 'mo-24', funcao: 'Serventes', empresa: 'Construtora Principal', quantidade: 9, temHoraExtra: false },
      { id: 'mo-25', funcao: 'Armadores', empresa: 'AçoForte Subempreiteira', quantidade: 4, temHoraExtra: false },
      { id: 'mo-26', funcao: 'Eletricistas', empresa: 'VoltInstal Engenharia', quantidade: 3, temHoraExtra: false }
    ],
    equipamentos: [
      { id: 'eq-21', nome: 'Guincho de Coluna 500kg', quantidade: 2, status: 'operando', horasTrabalhadas: 8 },
      { id: 'eq-22', nome: 'Betoneira 400L', quantidade: 1, status: 'operando', horasTrabalhadas: 6 },
      { id: 'eq-23', nome: 'Martelete Rompedor', quantidade: 2, status: 'operando', horasTrabalhadas: 4 }
    ],
    atividades: [
      {
        id: 'atv-21',
        etapa: 'Estrutura de Concreto Armado',
        localizacao: 'Laje do 7º Pavimento e Pilares do 8º',
        descricao: 'Início da cura úmida da laje concretada ontem com aspersão contínua de água. Início da montagem das armaduras dos pilares P701 a P710.',
        progressoPercentual: 90
      },
      {
        id: 'atv-22',
        etapa: 'Alvenaria de Vedação',
        localizacao: '4º e 5º Pavimentos',
        descricao: 'Conclusão da alvenaria do 4º pavimento e início da elevação no 5º pavimento (alinhamento e primeira fiada).',
        progressoPercentual: 75
      }
    ],
    ocorrencias: [],
    fotos: [
      {
        id: 'foto-21',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
        legenda: 'Cura úmida contínua da laje com manta geotêxtil.',
        etapa: 'Estrutura de Concreto Armado',
        horario: '11:00'
      }
    ],
    observacoesGerais: 'Ritmo acelerado nas armaduras de pilares. Sem intercorrências.',
    createdAt: '2026-09-16T17:00:00Z',
    updatedAt: '2026-09-16T17:00:00Z'
  }
];

export const INITIAL_USUARIOS: UsuarioEquipe[] = [
  {
    id: 'user-1',
    nome: 'Carlos Eduardo Martins',
    email: 'carlos.martins@engenharia.com.br',
    cargo: 'Engenheiro Residente',
    perfil: 'editor',
    obrasPermitidas: ['todas'],
    telefone: '(11) 98765-4321',
    senha: '123456',
    ativo: true,
    ultimoAcesso: 'Hoje às 10:45',
    dataCadastro: '2026-01-15'
  },
  {
    id: 'user-2',
    nome: 'Larissa Freitas',
    email: 'larissa.freitas@engenharia.com.br',
    cargo: 'Engenheira Coordenadora de Obras',
    perfil: 'editor',
    obrasPermitidas: ['todas'],
    telefone: '(11) 99123-4567',
    senha: '123456',
    ativo: true,
    ultimoAcesso: 'Hoje às 11:20',
    dataCadastro: '2026-01-20'
  },
  {
    id: 'user-3',
    nome: 'Marcos Roberto Silva',
    email: 'marcos.silva@canteiro.com.br',
    cargo: 'Encarregado Geral de Campo',
    perfil: 'editor',
    obrasPermitidas: ['obra-1'],
    telefone: '(11) 97654-3210',
    senha: '123456',
    ativo: true,
    ultimoAcesso: 'Ontem às 17:30',
    dataCadastro: '2026-02-01'
  },
  {
    id: 'user-4',
    nome: 'Roberto Antunes Mendes',
    email: 'roberto.fiscal@prefeitura.sp.gov.br',
    cargo: 'Fiscal Técnico / Auditoria',
    perfil: 'visualizador',
    obrasPermitidas: ['todas'],
    telefone: '(11) 98111-2233',
    senha: '123456',
    ativo: true,
    ultimoAcesso: '14/09/2026 às 15:10',
    dataCadastro: '2026-02-10'
  },
  {
    id: 'user-5',
    nome: 'Horizon Empreendimentos (Diretoria)',
    email: 'diretoria@horizonimoveis.com.br',
    cargo: 'Cliente / Proprietário do Empreendimento',
    perfil: 'visualizador',
    obrasPermitidas: ['obra-1'],
    telefone: '(11) 3456-7890',
    senha: '123456',
    ativo: true,
    ultimoAcesso: '12/09/2026 às 09:00',
    dataCadastro: '2026-02-15'
  }
];

