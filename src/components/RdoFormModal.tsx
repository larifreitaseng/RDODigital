import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle, 
  Building2, 
  Calendar, 
  CloudSun, 
  Users, 
  Wrench, 
  AlertTriangle, 
  Camera, 
  Plus, 
  Trash2, 
  Upload, 
  Clock,
  Sparkles,
  SwitchCamera,
  RefreshCw,
  Eye,
  Check,
  Folder,
  Settings2,
  Zap,
  ListPlus,
  CheckSquare
} from 'lucide-react';
import { DriveAndFolderService } from '../services/driveAndFolderService';
import { 
  RelatorioDiarioObra, 
  Obra, 
  Colaborador, 
  Equipamento, 
  CondicaoTempo, 
  Praticabilidade, 
  MaoDeObraAlocada, 
  EquipamentoAlocado, 
  AtividadeEtapa, 
  Ocorrencia, 
  FotoRDO,
  TipoOcorrencia,
  SeveridadeOcorrencia,
  UsuarioEquipe
} from '../types';
import { StorageService } from '../services/storageService';
import { compressImage } from '../services/imageCompression';

export const ETAPAS_CATEGORIZADAS = [
  {
    categoria: 'Instalações Prediais (Separadas)',
    itens: [
      'Instalações Hidráulicas e Sanitárias',
      'Instalações Elétricas e Dados',
      'Instalações de Climatização e Ventilação',
      'Prevenção e Combate a Incêndio (PPCI)',
      'Instalações de Gás e Utilidades'
    ]
  },
  {
    categoria: 'Acabamentos e Revestimentos (Separados)',
    itens: [
      'Contrapiso e Regularização de Piso',
      'Revestimentos Internos e Pisos',
      'Fachada e Pintura Externa',
      'Louças e Metais Sanitários',
      'Pintura Interna e Emassamento',
      'Gesso e Drywall (Forros e Divisórias)',
      'Impermeabilização e Isolamento',
      'Marmoraria, Granitos e Bancadas'
    ]
  },
  {
    categoria: 'Esquadrias e Vidros (Separados)',
    itens: [
      'Esquadrias de Madeira (Portas e Batentes)',
      'Esquadrias de Ferro e Alumínio',
      'Vidros, Espelhos e Pele de Vidro',
      'Esquadrias Metálicas e Serralheria'
    ]
  },
  {
    categoria: 'Estrutura, Fundações e Alvenaria',
    itens: [
      'Serviços Preliminares e Canteiro',
      'Demolição e Terraplenagem',
      'Fundações e Contenções',
      'Estrutura de Concreto Armado',
      'Estrutura Metálica',
      'Alvenaria e Vedações',
      'Cobertura e Telhado'
    ]
  },
  {
    categoria: 'Áreas Externas e Entrega',
    itens: [
      'Paisagismo e Pavimentação Externa',
      'Limpeza Final e Vistoria de Entrega',
      'Vistorias e Testes de Carga'
    ]
  }
];

export interface CargoPredefinido {
  cargo: string;
  empresaPadrao: string;
  qtdPadrao: number;
}

export interface CategoriaCargos {
  categoria: string;
  cargos: CargoPredefinido[];
}

export const CATEGORIAS_CARGOS_PADRAO: CategoriaCargos[] = [
  {
    categoria: 'Gestão, Engenharia e Supervisão',
    cargos: [
      { cargo: 'Engenheiro Residente', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Engenheiro Civil', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Engenheiro de Segurança do Trabalho', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Mestre de Obras Geral', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Encarregado Geral de Obras', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Técnico em Segurança do Trabalho', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Estagiário de Engenharia', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 }
    ]
  },
  {
    categoria: 'Produção Civil e Estrutural',
    cargos: [
      { cargo: 'Pedreiro de Alvenaria', empresaPadrao: 'Construtora Principal', qtdPadrao: 6 },
      { cargo: 'Pedreiro de Acabamento', empresaPadrao: 'Construtora Principal', qtdPadrao: 4 },
      { cargo: 'Servente de Obras', empresaPadrao: 'Construtora Principal', qtdPadrao: 8 },
      { cargo: 'Carpinteiro de Fôrmas', empresaPadrao: 'AçoForte Subempreiteira', qtdPadrao: 4 },
      { cargo: 'Armador de Estruturas / Ferragens', empresaPadrao: 'AçoForte Subempreiteira', qtdPadrao: 4 },
      { cargo: 'Meio-Oficial Pedreiro', empresaPadrao: 'Construtora Principal', qtdPadrao: 2 }
    ]
  },
  {
    categoria: 'Instalações, Acabamentos e Especiais',
    cargos: [
      { cargo: 'Eletricista Instalador Predial', empresaPadrao: 'VoltInstal Engenharia', qtdPadrao: 2 },
      { cargo: 'Encanador / Bombeiro Hidráulico', empresaPadrao: 'HidroTubos Ltda', qtdPadrao: 2 },
      { cargo: 'Pintor de Obras', empresaPadrao: 'Construtora Principal', qtdPadrao: 3 },
      { cargo: 'Gesseiro / Montador Drywall', empresaPadrao: 'Construtora Principal', qtdPadrao: 2 },
      { cargo: 'Serralheiro / Montador Metálico', empresaPadrao: 'Construtora Principal', qtdPadrao: 2 },
      { cargo: 'Impermeabilizador', empresaPadrao: 'Construtora Principal', qtdPadrao: 2 },
      { cargo: 'Azulejista / Revestidor', empresaPadrao: 'Construtora Principal', qtdPadrao: 2 }
    ]
  },
  {
    categoria: 'Máquinas, Logística e Apoio',
    cargos: [
      { cargo: 'Operador de Grua / Guindaste', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Operador de Máquinas Pesadas (Retro/Pá)', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Operador de Betoneira', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Almoxarife de Obra', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Apontador de Obra', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 },
      { cargo: 'Vigia / Portaria de Canteiro', empresaPadrao: 'Construtora Principal', qtdPadrao: 1 }
    ]
  }
];

export const TODOS_CARGOS_PADRAO = CATEGORIAS_CARGOS_PADRAO.flatMap(cat => cat.cargos.map(c => c.cargo));

interface RdoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rdo: RelatorioDiarioObra) => void;
  editingRdo?: RelatorioDiarioObra | null;
  obras: Obra[];
  colaboradores: Colaborador[];
  equipamentos: Equipamento[];
  usuarios?: UsuarioEquipe[];
  currentUser?: UsuarioEquipe | null;
  initialObraId?: string;
  initialDate?: string;
}

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export const RdoFormModal: React.FC<RdoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRdo,
  obras,
  colaboradores,
  equipamentos,
  usuarios,
  currentUser,
  initialObraId,
  initialDate
}) => {
  const [activeSection, setActiveSection] = useState<'geral' | 'clima' | 'atividades' | 'maodeobra' | 'equipamentos' | 'ocorrencias' | 'fotos'>('geral');

  // Obra e Identificação
  const [obraId, setObraId] = useState<string>('');
  const [numero, setNumero] = useState<number>(1);
  const [data, setData] = useState<string>('');
  const [diaSemana, setDiaSemana] = useState<string>('Segunda-feira');
  const [diasDecorridos, setDiasDecorridos] = useState<number>(1);
  const [elaboradoPor, setElaboradoPor] = useState<string>('Mestre de Obras');
  const [responsavelTecnico, setResponsavelTecnico] = useState<string>('');
  const [creaCau, setCreaCau] = useState<string>('');
  const [vistoFiscalizacao, setVistoFiscalizacao] = useState<string>('');

  // Modos de digitação manual (caso usuário queira customizar sem dropdown)
  const [isCustomElaborado, setIsCustomElaborado] = useState(false);
  const [isCustomResponsavel, setIsCustomResponsavel] = useState(false);
  const [isCustomCrea, setIsCustomCrea] = useState(false);
  const [isCustomFiscal, setIsCustomFiscal] = useState(false);

  // Clima
  const [manha, setManha] = useState<CondicaoTempo>('claro_ensolarado');
  const [tarde, setTarde] = useState<CondicaoTempo>('claro_ensolarado');
  const [noite, setNoite] = useState<CondicaoTempo>('claro_ensolarado');
  const [praticabilidade, setPraticabilidade] = useState<Praticabilidade>('praticavel');
  const [tempMin, setTempMin] = useState<number>(18);
  const [tempMax, setTempMax] = useState<number>(28);
  const [impactoChuvaHoras, setImpactoChuvaHoras] = useState<number>(0);
  const [observacaoClima, setObservacaoClima] = useState<string>('Tempo bom e seco.');

  // Atividades
  const [atividades, setAtividades] = useState<AtividadeEtapa[]>([]);

  // Mão de Obra
  const [maoDeObra, setMaoDeObra] = useState<MaoDeObraAlocada[]>([]);
  const [customFuncaoRows, setCustomFuncaoRows] = useState<Record<string, boolean>>({});
  const [customEmpresaRows, setCustomEmpresaRows] = useState<Record<string, boolean>>({});
  const [showQuickSelectModal, setShowQuickSelectModal] = useState<boolean>(false);
  const [quickSelectedCargos, setQuickSelectedCargos] = useState<Record<string, { selected: boolean; qtd: number }>>({});

  // Equipamentos
  const [equipamentosAlocados, setEquipamentosAlocados] = useState<EquipamentoAlocado[]>([]);

  // Ocorrências
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  // Fotos
  const [fotos, setFotos] = useState<FotoRDO[]>([]);

  // Observações Gerais
  const [observacoesGerais, setObservacoesGerais] = useState<string>('');

  // Câmera do Celular / WebCam
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Liberação de recursos de streaming da câmera
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Calculate day of week and days elapsed when date or obra changes
  const updateDateCalculations = (newDateStr: string, currentObraId: string) => {
    if (!newDateStr) return;
    const [y, m, d] = newDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    setDiaSemana(DIAS_SEMANA[dateObj.getDay()]);

    const selObra = obras.find(o => o.id === currentObraId);
    if (selObra && selObra.dataInicio) {
      const start = new Date(selObra.dataInicio);
      const diffTime = dateObj.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setDiasDecorridos(diffDays);
    }
  };

  useEffect(() => {
    if (editingRdo) {
      setObraId(editingRdo.obraId);
      setNumero(editingRdo.numero);
      setData(editingRdo.data);
      setDiaSemana(editingRdo.diaSemana);
      setDiasDecorridos(editingRdo.diasDecorridos);
      setElaboradoPor(editingRdo.elaboradoPor);
      setResponsavelTecnico(editingRdo.responsavelTecnico);
      setCreaCau(editingRdo.creaCau);
      setVistoFiscalizacao(editingRdo.vistoFiscalizacao || '');

      setManha(editingRdo.clima.manha);
      setTarde(editingRdo.clima.tarde);
      setNoite(editingRdo.clima.noite);
      setPraticabilidade(editingRdo.clima.praticabilidade);
      setTempMin(editingRdo.clima.temperaturaMin ?? 18);
      setTempMax(editingRdo.clima.temperaturaMax ?? 28);
      setImpactoChuvaHoras(editingRdo.clima.impactoChuvaHoras ?? 0);
      setObservacaoClima(editingRdo.clima.observacaoClima || '');

      setAtividades(editingRdo.atividades || []);
      setMaoDeObra(editingRdo.maoDeObra || []);
      setEquipamentosAlocados(editingRdo.equipamentos || []);
      setOcorrencias(editingRdo.ocorrencias || []);
      setFotos(editingRdo.fotos || []);
      setObservacoesGerais(editingRdo.observacoesGerais || '');
    } else {
      const defaultObra = initialObraId ? obras.find(o => o.id === initialObraId) : obras[0];
      const today = new Date().toISOString().split('T')[0];
      
      const targetObraId = defaultObra ? defaultObra.id : (obras[0]?.id || '');
      setObraId(targetObraId);
      
      if (targetObraId) {
        setNumero(StorageService.getNextNumeroRdo(targetObraId));
      } else {
        setNumero(1);
      }

      const targetDate = initialDate || today;
      setData(targetDate);
      updateDateCalculations(targetDate, targetObraId);

      if (defaultObra) {
        setResponsavelTecnico(defaultObra.responsavelTecnico);
        setCreaCau(defaultObra.creaCau);
        setVistoFiscalizacao(defaultObra.cliente);
      } else {
        setResponsavelTecnico('');
        setCreaCau('');
        setVistoFiscalizacao('');
      }

      const defaultElaborador = currentUser?.nome 
        ? `${currentUser.nome}${currentUser.cargo ? ` (${currentUser.cargo})` : ''}`
        : 'Antônio dos Santos (Mestre de Obras)';
      setElaboradoPor(defaultElaborador);
      setIsCustomElaborado(false);
      setIsCustomResponsavel(false);
      setIsCustomCrea(false);
      setIsCustomFiscal(false);
      setManha('claro_ensolarado');
      setTarde('claro_ensolarado');
      setNoite('claro_ensolarado');
      setPraticabilidade('praticavel');
      setTempMin(19);
      setTempMax(29);
      setImpactoChuvaHoras(0);
      setObservacaoClima('Condições climáticas favoráveis em todos os períodos.');

      // Default sample activity
      const firstEtapa = defaultObra?.etapas?.[0] || 'Estrutura de Concreto Armado';
      setAtividades([
        {
          id: `atv-${Date.now()}`,
          etapa: firstEtapa,
          localizacao: 'Canteiro Geral',
          descricao: 'Execução das tarefas programadas conforme cronograma físico.',
          progressoPercentual: 10
        }
      ]);

      // Populate default active workforce from registered colaboradores
      const initialMo: MaoDeObraAlocada[] = colaboradores.filter(c => c.ativo).slice(0, 5).map(c => ({
        id: `mo-${c.id}-${Date.now()}`,
        colaboradorId: c.id,
        funcao: c.funcao,
        empresa: c.empresa,
        quantidade: c.tipo === 'proprio' ? (c.funcao.includes('Pedreiro') ? 6 : c.funcao.includes('Servente') ? 8 : 1) : 4,
        temHoraExtra: false
      }));
      setMaoDeObra(initialMo);

      // Default active equipment
      const initialEq: EquipamentoAlocado[] = equipamentos.filter(e => e.status === 'operando').slice(0, 3).map(e => ({
        id: `eq-aloc-${e.id}`,
        equipamentoId: e.id,
        nome: e.nome,
        quantidade: e.quantidade,
        status: e.status,
        horasTrabalhadas: 8
      }));
      setEquipamentosAlocados(initialEq);

      setOcorrencias([]);
      setFotos([]);
      setObservacoesGerais('DDS realizado no início da jornada com foco em uso de EPIs e organização do canteiro. Dia sem incidentes.');
    }
  }, [editingRdo, isOpen, initialObraId, obras]);

  if (!isOpen) return null;

  const currentObra = obras.find(o => o.id === obraId);

  // Lista de Usuários e Equipe disponíveis
  const teamUsers = (usuarios && usuarios.length > 0) ? usuarios : StorageService.getUsuarios();

  // Opções para "Elaborado por (Canteiro)"
  const elaboradoOptions = React.useMemo(() => {
    const list: string[] = [];

    // Usuário logado no topo
    if (currentUser?.nome) {
      list.push(`${currentUser.nome}${currentUser.cargo ? ` (${currentUser.cargo})` : ''}`);
    }

    // Usuários do sistema
    teamUsers.forEach(u => {
      const formatted = `${u.nome}${u.cargo ? ` (${u.cargo})` : ''}`;
      if (!list.includes(formatted)) {
        list.push(formatted);
      }
    });

    // Colaboradores de canteiro ativos
    colaboradores.filter(c => c.ativo).forEach(c => {
      const formatted = `${c.nome}${c.funcao ? ` (${c.funcao})` : ''}`;
      if (!list.includes(formatted)) {
        list.push(formatted);
      }
    });

    // Padrões consolidados da construtora
    const padroes = [
      'Antônio dos Santos (Mestre de Obras)',
      'Carlos Eduardo Martins (Engenheiro Residente)',
      'Marcos Roberto Silva (Encarregado Geral de Campo)',
      'Marcos Vinícius Silva (Técnico em Segurança do Trabalho)',
      'Larissa Freitas (Engenheira Coordenadora)'
    ];
    padroes.forEach(p => {
      if (!list.includes(p)) {
        list.push(p);
      }
    });

    // Garante que o valor atual selecionado permaneça no dropdown
    if (elaboradoPor && !list.includes(elaboradoPor)) {
      list.unshift(elaboradoPor);
    }

    return list;
  }, [teamUsers, colaboradores, currentUser, elaboradoPor]);

  // Opções para "Responsável Técnico (Engenheiro Residente)"
  const responsavelOptions = React.useMemo(() => {
    const list: { nome: string; crea?: string }[] = [];

    // Responsáveis cadastrados nas obras
    obras.forEach(o => {
      if (o.responsavelTecnico && !list.some(item => item.nome.toLowerCase() === o.responsavelTecnico.toLowerCase())) {
        list.push({ nome: o.responsavelTecnico, crea: o.creaCau });
      }
    });

    // Usuários com perfil técnico
    teamUsers.forEach(u => {
      if (u.cargo && (u.cargo.toLowerCase().includes('eng') || u.cargo.toLowerCase().includes('arquit') || u.cargo.toLowerCase().includes('coord'))) {
        const nomeFormatado = u.nome.startsWith('Eng') ? u.nome : `Eng. ${u.nome}`;
        if (!list.some(item => item.nome.toLowerCase().includes(u.nome.toLowerCase()))) {
          const creaMatch = obras.find(o => o.responsavelTecnico?.toLowerCase().includes(u.nome.toLowerCase()))?.creaCau;
          list.push({ nome: nomeFormatado, crea: creaMatch });
        }
      }
    });

    // Valores padrão da construtora
    const defaults = [
      { nome: 'Eng. Carlos Eduardo Martins', crea: 'CREA-SP 5062491823' },
      { nome: 'Engª. Larissa Freitas', crea: 'CREA-SP 5078192044' }
    ];
    defaults.forEach(d => {
      if (!list.some(item => item.nome.toLowerCase() === d.nome.toLowerCase())) {
        list.push(d);
      }
    });

    // Garante valor atual
    if (responsavelTecnico && !list.some(item => item.nome === responsavelTecnico)) {
      list.unshift({ nome: responsavelTecnico, crea: creaCau });
    }

    return list;
  }, [obras, teamUsers, responsavelTecnico, creaCau]);

  // Opções para "Registro Profissional (CREA / CAU)"
  const creaOptions = React.useMemo(() => {
    const list: { crea: string; titular?: string }[] = [];

    obras.forEach(o => {
      if (o.creaCau && !list.some(item => item.crea === o.creaCau)) {
        list.push({ crea: o.creaCau, titular: o.responsavelTecnico });
      }
    });

    const defaults = [
      { crea: 'CREA-SP 5062491823', titular: 'Eng. Carlos Eduardo Martins' },
      { crea: 'CREA-SP 5078192044', titular: 'Engª. Larissa Freitas' }
    ];
    defaults.forEach(d => {
      if (!list.some(item => item.crea === d.crea)) {
        list.push(d);
      }
    });

    if (creaCau && !list.some(item => item.crea === creaCau)) {
      list.unshift({ crea: creaCau, titular: responsavelTecnico });
    }

    return list;
  }, [obras, creaCau, responsavelTecnico]);

  // Opções para "Fiscalização / Contratante (Visto)"
  const fiscalizacaoOptions = React.useMemo(() => {
    const list: string[] = [];

    // Clientes das obras
    obras.forEach(o => {
      if (o.cliente && !list.includes(o.cliente)) {
        list.push(o.cliente);
      }
    });

    // Fiscais cadastrados nos usuários
    teamUsers.forEach(u => {
      if (u.cargo && (u.cargo.toLowerCase().includes('fisc') || u.cargo.toLowerCase().includes('client') || u.cargo.toLowerCase().includes('propriet'))) {
        const formatted = `${u.nome} (${u.cargo})`;
        if (!list.includes(formatted)) {
          list.push(formatted);
        }
      }
    });

    const defaults = [
      'Horizon Empreendimentos Imobiliários S.A.',
      'Alpha Logística e Armazéns Ltda',
      'Arq. Mariana Lemos (Fiscal do Cliente)',
      'Roberto Antunes Mendes (Fiscal Técnico / Auditoria)',
      'Horizon Empreendimentos (Diretoria)'
    ];
    defaults.forEach(d => {
      if (!list.includes(d)) {
        list.push(d);
      }
    });

    if (vistoFiscalizacao && !list.includes(vistoFiscalizacao)) {
      list.unshift(vistoFiscalizacao);
    }

    return list;
  }, [obras, teamUsers, vistoFiscalizacao]);

  const handleSelectResponsavelTecnico = (val: string) => {
    if (val === '__custom__') {
      setIsCustomResponsavel(true);
      return;
    }
    setIsCustomResponsavel(false);
    setResponsavelTecnico(val);

    // Auto-preenche o CREA/CAU correspondente automaticamente
    const matched = responsavelOptions.find(p => p.nome === val);
    if (matched && matched.crea) {
      setCreaCau(matched.crea);
    } else {
      const matchObra = obras.find(o => o.responsavelTecnico?.toLowerCase().trim() === val.toLowerCase().trim() || val.toLowerCase().includes(o.responsavelTecnico?.toLowerCase().trim() || ''));
      if (matchObra?.creaCau) {
        setCreaCau(matchObra.creaCau);
      } else if (val.includes('Carlos Eduardo')) {
        setCreaCau('CREA-SP 5062491823');
      } else if (val.includes('Larissa Freitas')) {
        setCreaCau('CREA-SP 5078192044');
      }
    }
  };

  const handleObraChange = (newObraId: string) => {
    setObraId(newObraId);
    const ob = obras.find(o => o.id === newObraId);
    if (ob) {
      setResponsavelTecnico(ob.responsavelTecnico);
      setCreaCau(ob.creaCau);
      setVistoFiscalizacao(ob.cliente);
      setNumero(StorageService.getNextNumeroRdo(newObraId));
      updateDateCalculations(data, newObraId);
    }
  };

  const handleDateChange = (newDateStr: string) => {
    setData(newDateStr);
    updateDateCalculations(newDateStr, obraId);
  };

  // Handlers for Atividades
  const addAtividade = () => {
    const etapaPadrao = currentObra?.etapas?.[0] || 'Geral';
    setAtividades([
      ...atividades,
      {
        id: `atv-${Date.now()}-${Math.random()}`,
        etapa: etapaPadrao,
        localizacao: '',
        descricao: '',
        progressoPercentual: 0
      }
    ]);
  };

  const removeAtividade = (id: string) => {
    setAtividades(atividades.filter(a => a.id !== id));
  };

  const updateAtividade = (id: string, field: keyof AtividadeEtapa, value: any) => {
    setAtividades(atividades.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // Funções extras vindas dos colaboradores cadastrados que não estão na lista padrão
  const colabCargosExtras = React.useMemo(() => {
    const extras: string[] = [];
    colaboradores.forEach(c => {
      if (c.funcao && !TODOS_CARGOS_PADRAO.includes(c.funcao) && !extras.includes(c.funcao)) {
        extras.push(c.funcao);
      }
    });
    return extras;
  }, [colaboradores]);

  // Lista de empresas para seleção nos itens de mão de obra
  const empresasMaoDeObra = React.useMemo(() => {
    const list: string[] = ['Construtora Principal'];
    if (currentObra?.cliente && !list.includes(currentObra.cliente)) {
      list.push(currentObra.cliente);
    }
    colaboradores.forEach(c => {
      if (c.empresa && !list.includes(c.empresa)) {
        list.push(c.empresa);
      }
    });
    const defaults = ['AçoForte Subempreiteira', 'VoltInstal Engenharia', 'HidroTubos Ltda', 'Própria'];
    defaults.forEach(d => {
      if (!list.includes(d)) list.push(d);
    });
    return list;
  }, [currentObra, colaboradores]);

  // Handlers for Mão de Obra
  const handleSelectFuncao = (moId: string, cargoName: string) => {
    if (cargoName === '__custom__') {
      setCustomFuncaoRows(prev => ({ ...prev, [moId]: true }));
      return;
    }

    setCustomFuncaoRows(prev => ({ ...prev, [moId]: false }));

    // Procura empresa padrão sugerida e quantidade padrão
    let suggestedEmpresa = '';
    let suggestedQtd: number | undefined = undefined;

    // 1. Procura em colaboradores cadastrados
    const colabMatch = colaboradores.find(c => c.funcao?.toLowerCase().trim() === cargoName.toLowerCase().trim());
    if (colabMatch?.empresa) {
      suggestedEmpresa = colabMatch.empresa;
    } else {
      for (const cat of CATEGORIAS_CARGOS_PADRAO) {
        const found = cat.cargos.find(c => c.cargo === cargoName);
        if (found) {
          suggestedEmpresa = found.empresaPadrao;
          suggestedQtd = found.qtdPadrao;
          break;
        }
      }
    }

    setMaoDeObra(prev => prev.map(m => {
      if (m.id === moId) {
        const isEmpresaGenerica = !m.empresa || m.empresa === 'Própria' || m.empresa === 'Construtora Principal';
        return {
          ...m,
          funcao: cargoName,
          empresa: (isEmpresaGenerica && suggestedEmpresa) ? suggestedEmpresa : (m.empresa || suggestedEmpresa || 'Construtora Principal'),
          quantidade: (m.quantidade === 1 && suggestedQtd && suggestedQtd > 1) ? suggestedQtd : m.quantidade
        };
      }
      return m;
    }));
  };

  const addMaoDeObraRow = (customCargo?: string, customEmp?: string, customQtd?: number) => {
    const cargoNome = customCargo || 'Pedreiro de Alvenaria';
    let suggestedEmp = customEmp;
    if (!suggestedEmp) {
      const colabMatch = colaboradores.find(c => c.funcao?.toLowerCase().trim() === cargoNome.toLowerCase().trim());
      if (colabMatch?.empresa) {
        suggestedEmp = colabMatch.empresa;
      } else {
        const found = CATEGORIAS_CARGOS_PADRAO.flatMap(cat => cat.cargos).find(c => c.cargo === cargoNome);
        suggestedEmp = found ? found.empresaPadrao : (currentObra ? 'Construtora Principal' : 'Própria');
      }
    }

    const newId = `mo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setMaoDeObra(prev => [
      ...prev,
      {
        id: newId,
        funcao: cargoNome,
        empresa: suggestedEmp || 'Construtora Principal',
        quantidade: customQtd || 1,
        temHoraExtra: false
      }
    ]);
  };

  const removeMaoDeObra = (id: string) => {
    setMaoDeObra(maoDeObra.filter(m => m.id !== id));
    setCustomFuncaoRows(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setCustomEmpresaRows(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const updateMaoDeObra = (id: string, field: keyof MaoDeObraAlocada, value: any) => {
    setMaoDeObra(maoDeObra.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Preenchimento Automático em Lote: Equipe Padrão de Canteiro
  const handlePreencherEquipePadrao = () => {
    const equipePadrao: MaoDeObraAlocada[] = [
      { id: `mo-${Date.now()}-1`, funcao: 'Engenheiro Residente', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: `mo-${Date.now()}-2`, funcao: 'Mestre de Obras Geral', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: `mo-${Date.now()}-3`, funcao: 'Técnico em Segurança do Trabalho', empresa: 'Construtora Principal', quantidade: 1, temHoraExtra: false },
      { id: `mo-${Date.now()}-4`, funcao: 'Pedreiro de Alvenaria', empresa: 'Construtora Principal', quantidade: 6, temHoraExtra: false },
      { id: `mo-${Date.now()}-5`, funcao: 'Servente de Obras', empresa: 'Construtora Principal', quantidade: 8, temHoraExtra: false }
    ];
    setMaoDeObra(equipePadrao);
  };

  // Preenchimento Automático a partir dos Colaboradores Cadastrados
  const handleImportarColaboradoresCadastrados = () => {
    const ativos = colaboradores.filter(c => c.ativo);
    if (ativos.length === 0) return;

    const mapa = new Map<string, { funcao: string; empresa: string; quantidade: number }>();
    ativos.forEach(c => {
      const chave = `${c.funcao}__${c.empresa}`;
      if (mapa.has(chave)) {
        mapa.get(chave)!.quantidade += 1;
      } else {
        const qtdInicial = c.tipo === 'proprio' ? (c.funcao.includes('Pedreiro') ? 6 : c.funcao.includes('Servente') ? 8 : 1) : 4;
        mapa.set(chave, {
          funcao: c.funcao,
          empresa: c.empresa || 'Construtora Principal',
          quantidade: qtdInicial
        });
      }
    });

    const novasLinhas: MaoDeObraAlocada[] = Array.from(mapa.values()).map((item, idx) => ({
      id: `mo-colab-${Date.now()}-${idx}`,
      funcao: item.funcao,
      empresa: item.empresa,
      quantidade: item.quantidade,
      temHoraExtra: false
    }));

    setMaoDeObra(novasLinhas);
  };

  // Modal de Seleção Múltipla de Cargos
  const handleOpenQuickSelectModal = () => {
    const initialMap: Record<string, { selected: boolean; qtd: number }> = {};
    
    CATEGORIAS_CARGOS_PADRAO.forEach(cat => {
      cat.cargos.forEach(item => {
        const existing = maoDeObra.find(m => m.funcao.toLowerCase().trim() === item.cargo.toLowerCase().trim());
        initialMap[item.cargo] = {
          selected: !!existing,
          qtd: existing ? existing.quantidade : item.qtdPadrao
        };
      });
    });

    colabCargosExtras.forEach(cargo => {
      const existing = maoDeObra.find(m => m.funcao.toLowerCase().trim() === cargo.toLowerCase().trim());
      initialMap[cargo] = {
        selected: !!existing,
        qtd: existing ? existing.quantidade : 1
      };
    });

    setQuickSelectedCargos(initialMap);
    setShowQuickSelectModal(true);
  };

  const handleApplyQuickSelect = (substituir: boolean) => {
    const selecionados: MaoDeObraAlocada[] = [];

    CATEGORIAS_CARGOS_PADRAO.forEach(cat => {
      cat.cargos.forEach(item => {
        const state = quickSelectedCargos[item.cargo];
        if (state?.selected) {
          selecionados.push({
            id: `mo-sel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            funcao: item.cargo,
            empresa: item.empresaPadrao,
            quantidade: state.qtd || item.qtdPadrao,
            temHoraExtra: false
          });
        }
      });
    });

    colabCargosExtras.forEach(cargo => {
      const state = quickSelectedCargos[cargo];
      if (state?.selected) {
        const colab = colaboradores.find(c => c.funcao === cargo);
        selecionados.push({
          id: `mo-sel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          funcao: cargo,
          empresa: colab?.empresa || 'Construtora Principal',
          quantidade: state.qtd || 1,
          temHoraExtra: false
        });
      }
    });

    if (substituir) {
      setMaoDeObra(selecionados);
    } else {
      const existentesFuncoes = maoDeObra.map(m => m.funcao.toLowerCase().trim());
      const novos = selecionados.filter(s => !existentesFuncoes.includes(s.funcao.toLowerCase().trim()));
      setMaoDeObra(prev => [...prev, ...novos]);
    }

    setShowQuickSelectModal(false);
  };

  // Handlers for Equipamentos
  const addEquipamentoRow = () => {
    setEquipamentosAlocados([
      ...equipamentosAlocados,
      {
        id: `eq-${Date.now()}`,
        nome: 'Betoneira 400L',
        quantidade: 1,
        status: 'operando',
        horasTrabalhadas: 8
      }
    ]);
  };

  const removeEquipamento = (id: string) => {
    setEquipamentosAlocados(equipamentosAlocados.filter(e => e.id !== id));
  };

  const updateEquipamento = (id: string, field: keyof EquipamentoAlocado, value: any) => {
    setEquipamentosAlocados(equipamentosAlocados.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Handlers for Ocorrências
  const addOcorrencia = () => {
    setOcorrencias([
      ...ocorrencias,
      {
        id: `oc-${Date.now()}`,
        tipo: 'material',
        titulo: '',
        descricao: '',
        severidade: 'baixa',
        acaoTomada: '',
        resolvida: true
      }
    ]);
  };

  const removeOcorrencia = (id: string) => {
    setOcorrencias(ocorrencias.filter(o => o.id !== id));
  };

  const updateOcorrencia = (id: string, field: keyof Ocorrencia, value: any) => {
    setOcorrencias(ocorrencias.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setCameraLoading(true);
    setIsCameraActive(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Câmera em tempo real indisponível, acionando captura direta do dispositivo:', err);
      setCameraLoading(false);
      setIsCameraActive(false);
      // Dispara imediatamente o seletor com capture="environment"
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      } else {
        setCameraError('Não foi possível inicializar a câmera. Utilize a opção de tirar foto com a câmera do celular.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const currentEtapa = atividades[0]?.etapa || currentObra?.etapas?.[0] || 'Registro de Campo';

    try {
      const compressedUrl = await compressImage(rawDataUrl, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
      const newPhoto: FotoRDO = {
        id: `foto-${Date.now()}-${Math.random()}`,
        url: compressedUrl,
        legenda: `Registro instantâneo em campo - ${timeStr}`,
        etapa: currentEtapa,
        horario: timeStr
      };
      setFotos(prev => [...prev, newPhoto]);
    } catch {
      const newPhoto: FotoRDO = {
        id: `foto-${Date.now()}-${Math.random()}`,
        url: rawDataUrl,
        legenda: `Registro instantâneo em campo - ${timeStr}`,
        etapa: currentEtapa,
        horario: timeStr
      };
      setFotos(prev => [...prev, newPhoto]);
    }
    stopCamera();
  };

  // Handlers for Fotos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(async (file: File) => {
      try {
        const compressedUrl = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
        const newPhoto: FotoRDO = {
          id: `foto-${Date.now()}-${Math.random()}`,
          url: compressedUrl,
          legenda: file.name.replace(/\.[^/.]+$/, ''),
          etapa: currentObra?.etapas?.[0] || 'Registro de Obra',
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setFotos(prev => [...prev, newPhoto]);
      } catch (err) {
        console.warn('Erro ao processar e comprimir imagem selecionada:', err);
      }
    });

    e.target.value = '';
  };

  const removeFoto = (id: string) => {
    setFotos(fotos.filter(f => f.id !== id));
  };

  const updateFoto = (id: string, field: keyof FotoRDO, value: any) => {
    setFotos(fotos.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!obraId) {
      alert('Selecione uma obra para vincular ao relatório diário.');
      return;
    }

    if (!data) {
      alert('Selecione a data do relatório.');
      return;
    }

    // Certifica que todas as fotos anexadas estejam otimizadas antes de persistir
    const sanitizedFotos: FotoRDO[] = await Promise.all(
      fotos.map(async (foto) => {
        if (foto.url && foto.url.length > 250000) {
          try {
            const compressed = await compressImage(foto.url, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
            return { ...foto, url: compressed };
          } catch {
            return foto;
          }
        }
        return foto;
      })
    );

    const rdo: RelatorioDiarioObra = {
      id: editingRdo ? editingRdo.id : `rdo-${Date.now()}`,
      numero: Number(numero) || 1,
      obraId,
      data,
      diaSemana,
      diasDecorridos: Number(diasDecorridos) || 1,
      elaboradoPor: elaboradoPor.trim(),
      responsavelTecnico: responsavelTecnico.trim(),
      creaCau: creaCau.trim(),
      vistoFiscalizacao: vistoFiscalizacao.trim(),
      clima: {
        manha,
        tarde,
        noite,
        praticabilidade,
        temperaturaMin: Number(tempMin),
        temperaturaMax: Number(tempMax),
        impactoChuvaHoras: Number(impactoChuvaHoras),
        observacaoClima: observacaoClima.trim()
      },
      maoDeObra,
      equipamentos: equipamentosAlocados,
      atividades,
      ocorrencias,
      fotos: sanitizedFotos,
      observacoesGerais: observacoesGerais.trim(),
      createdAt: editingRdo ? editingRdo.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(rdo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center">
              RDO
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {editingRdo ? `Editar RDO Nº ${editingRdo.numero}` : 'Elaboração de Relatório Diário de Obra (RDO)'}
              </h3>
              <p className="text-xs text-slate-400">Preencha os dados de campo para gerar o documento técnico oficial em PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center space-x-1 px-6 py-2 border-b border-slate-200 bg-slate-100 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('geral')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'geral' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Geral e Obra
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('clima')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'clima' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Clima ({praticabilidade === 'praticavel' ? 'Praticável' : 'Chuva/Parc'})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('atividades')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'atividades' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Atividades ({atividades.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('maodeobra')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'maodeobra' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. Mão de Obra ({maoDeObra.reduce((a, b) => a + (Number(b.quantidade) || 0), 0)})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('equipamentos')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'equipamentos' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            5. Equipamentos ({equipamentosAlocados.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('ocorrencias')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'ocorrencias' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            6. Ocorrências ({ocorrencias.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('fotos')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'fotos' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            7. Fotos ({fotos.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800">
          
          {/* SECTION 1: GERAL E OBRA */}
          {activeSection === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                Identificação do Diário e Obra
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Obra Vinculada *
                  </label>
                  <select
                    value={obraId}
                    onChange={(e) => handleObraChange(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {obras.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nome} ({o.cliente})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número Sequencial RDO *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={numero}
                    onChange={(e) => setNumero(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Relatório *
                  </label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dia da Semana
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={diaSemana}
                    className="w-full text-xs border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-slate-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dias Decorridos de Obra
                  </label>
                  <input
                    type="number"
                    value={diasDecorridos}
                    onChange={(e) => setDiasDecorridos(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Elaborado por (Canteiro) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomElaborado(!isCustomElaborado)}
                      className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                      title={isCustomElaborado ? 'Voltar para a lista com seta' : 'Digitar nome livremente'}
                    >
                      {isCustomElaborado ? '← Selecionar da lista' : '+ Digitar outro'}
                    </button>
                  </div>
                  {isCustomElaborado ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nome e cargo de quem elaborou"
                        value={elaboradoPor}
                        onChange={(e) => setElaboradoPor(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomElaborado(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 shrink-0"
                      >
                        Lista
                      </button>
                    </div>
                  ) : (
                    <select
                      value={elaboradoPor}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomElaborado(true);
                        } else {
                          setElaboradoPor(e.target.value);
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Selecione quem elaborou o diário --</option>
                      {elaboradoOptions.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value="__custom__">+ Digitar outro nome...</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Responsável Técnico (Engenheiro Residente) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomResponsavel(!isCustomResponsavel)}
                      className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                      title={isCustomResponsavel ? 'Voltar para a lista com seta' : 'Digitar nome livremente'}
                    >
                      {isCustomResponsavel ? '← Selecionar da lista' : '+ Digitar outro'}
                    </button>
                  </div>
                  {isCustomResponsavel ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nome do engenheiro / arquiteto"
                        value={responsavelTecnico}
                        onChange={(e) => setResponsavelTecnico(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomResponsavel(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 shrink-0"
                      >
                        Lista
                      </button>
                    </div>
                  ) : (
                    <select
                      value={responsavelTecnico}
                      onChange={(e) => handleSelectResponsavelTecnico(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Selecione o Responsável Técnico --</option>
                      {responsavelOptions.map(p => (
                        <option key={p.nome} value={p.nome}>
                          {p.nome} {p.crea ? `(${p.crea})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Digitar outro responsável...</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Registro Profissional (CREA / CAU)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCrea(!isCustomCrea)}
                      className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                      title={isCustomCrea ? 'Voltar para a lista com seta' : 'Digitar registro livremente'}
                    >
                      {isCustomCrea ? '← Selecionar da lista' : '+ Digitar outro'}
                    </button>
                  </div>
                  {isCustomCrea ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: CREA-SP 5062491823"
                        value={creaCau}
                        onChange={(e) => setCreaCau(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCrea(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 shrink-0"
                      >
                        Lista
                      </button>
                    </div>
                  ) : (
                    <select
                      value={creaCau}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCrea(true);
                        } else {
                          setCreaCau(e.target.value);
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Selecione o Registro CREA / CAU --</option>
                      {creaOptions.map(c => (
                        <option key={c.crea} value={c.crea}>
                          {c.crea} {c.titular ? `(${c.titular})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Digitar outro registro...</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Fiscalização / Contratante (Visto)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomFiscal(!isCustomFiscal)}
                      className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                      title={isCustomFiscal ? 'Voltar para a lista com seta' : 'Digitar fiscal livremente'}
                    >
                      {isCustomFiscal ? '← Selecionar da lista' : '+ Digitar outro'}
                    </button>
                  </div>
                  {isCustomFiscal ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nome do fiscal ou empresa cliente"
                        value={vistoFiscalizacao}
                        onChange={(e) => setVistoFiscalizacao(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomFiscal(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 shrink-0"
                      >
                        Lista
                      </button>
                    </div>
                  ) : (
                    <select
                      value={vistoFiscalizacao}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomFiscal(true);
                        } else {
                          setVistoFiscalizacao(e.target.value);
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Selecione o Fiscal ou Contratante --</option>
                      {fiscalizacaoOptions.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                      <option value="__custom__">+ Digitar outro fiscal/contratante...</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Gerais / DDS (Diálogo Diário de Segurança)
                </label>
                <textarea
                  rows={3}
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  placeholder="Registre treinamentos de segurança, visitas de fornecedores ou recados importantes do canteiro."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('clima')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Próximo: Clima e Praticabilidade →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: CLIMA E PRATICABILIDADE */}
          {activeSection === 'clima' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                2. Condições Climáticas e Impacto na Obra
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manhã</label>
                  <select
                    value={manha}
                    onChange={(e) => setManha(e.target.value as CondicaoTempo)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="claro_ensolarado">☀️ Claro / Ensolarado</option>
                    <option value="parcialmente_nublado">⛅ Parcialmente Nublado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuva_fraca">🌧️ Chuva Fraca / Garôa</option>
                    <option value="chuva_forte">⛈️ Chuva Forte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarde</label>
                  <select
                    value={tarde}
                    onChange={(e) => setTarde(e.target.value as CondicaoTempo)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="claro_ensolarado">☀️ Claro / Ensolarado</option>
                    <option value="parcialmente_nublado">⛅ Parcialmente Nublado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuva_fraca">🌧️ Chuva Fraca / Garôa</option>
                    <option value="chuva_forte">⛈️ Chuva Forte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Noite</label>
                  <select
                    value={noite}
                    onChange={(e) => setNoite(e.target.value as CondicaoTempo)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="claro_ensolarado">🌙 Céu Limpo</option>
                    <option value="parcialmente_nublado">⛅ Parcialmente Nublado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuva_fraca">🌧️ Chuva Fraca</option>
                    <option value="chuva_forte">⛈️ Chuva Forte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Praticabilidade da Obra
                  </label>
                  <select
                    value={praticabilidade}
                    onChange={(e) => setPraticabilidade(e.target.value as Praticabilidade)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="praticavel">🟢 PRATICÁVEL (Normal)</option>
                    <option value="parcialmente_praticavel">🟡 PARCIALMENTE PRATICÁVEL</option>
                    <option value="impraticavel">🔴 IMPRATICÁVEL (Paralisada)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temperatura Estimada (°C)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={tempMin}
                      onChange={(e) => setTempMin(Number(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2"
                    />
                    <span className="text-slate-400">a</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      value={tempMax}
                      onChange={(e) => setTempMax(Number(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas Paradas por Chuva
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={impactoChuvaHoras}
                    onChange={(e) => setImpactoChuvaHoras(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações do Tempo
                </label>
                <input
                  type="text"
                  value={observacaoClima}
                  onChange={(e) => setObservacaoClima(e.target.value)}
                  placeholder="Ex: Chuva torrencial entre 14h e 16h impediu concretagem de vigas."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('geral')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('atividades')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Próximo: Atividades Executadas →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: ATIVIDADES */}
          {activeSection === 'atividades' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Etapas e Serviços Executados no Dia
                </h4>
                <button
                  type="button"
                  onClick={addAtividade}
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
                </button>
              </div>

              {atividades.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 mb-2">Nenhuma atividade descrita para este relatório.</p>
                  <button
                    type="button"
                    onClick={addAtividade}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-md"
                  >
                    + Adicionar Primeira Atividade
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {atividades.map((atv, index) => (
                    <div key={atv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">Atividade #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAtividade(atv.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[11px] font-semibold text-slate-600">Etapa da Obra *</label>
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                              Etapa detalhada
                            </span>
                          </div>
                          <select
                            value={atv.etapa}
                            onChange={(e) => updateAtividade(atv.id, 'etapa', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                          >
                            {/* Etapas Cadastradas na Obra */}
                            {currentObra?.etapas && currentObra.etapas.length > 0 && (
                              <optgroup label={`Etapas Cadastradas na Obra (${currentObra.nome})`}>
                                {currentObra.etapas.map((et, i) => (
                                  <option key={`obra-et-${i}`} value={et}>{et}</option>
                                ))}
                              </optgroup>
                            )}

                            {/* Categorias Expandidas (Contrapiso, Louças e Metais, Esquadrias separadas, etc.) */}
                            {ETAPAS_CATEGORIZADAS.map((cat, cIdx) => (
                              <optgroup key={`cat-${cIdx}`} label={cat.categoria}>
                                {cat.itens.map((item, iIdx) => (
                                  <option key={`cat-${cIdx}-item-${iIdx}`} value={item}>{item}</option>
                                ))}
                              </optgroup>
                            ))}

                            {/* Etapa personalizada caso já tenha sido digitada */}
                            {atv.etapa && 
                              !ETAPAS_CATEGORIZADAS.some(c => c.itens.includes(atv.etapa)) && 
                              !currentObra?.etapas?.includes(atv.etapa) && (
                                <optgroup label="Outra Etapa Personalizada">
                                  <option value={atv.etapa}>{atv.etapa}</option>
                                </optgroup>
                              )
                            }
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Localização / Pavimento</label>
                          <input
                            type="text"
                            placeholder="Ex: 5º Pavimento / Bloco B"
                            value={atv.localizacao || ''}
                            onChange={(e) => updateAtividade(atv.id, 'localizacao', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Progresso da Etapa (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={atv.progressoPercentual ?? 0}
                            onChange={(e) => updateAtividade(atv.id, 'progressoPercentual', Number(e.target.value))}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Descrição Técnica Detalhada do Serviço *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Detalhe o que foi assentado, concretado, montado ou executado."
                          value={atv.descricao}
                          onChange={(e) => updateAtividade(atv.id, 'descricao', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('clima')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('maodeobra')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Próximo: Mão de Obra →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: MÃO DE OBRA */}
          {activeSection === 'maodeobra' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    4. Efetivo de Mão de Obra Presente
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Total atual: <strong className="text-slate-900">{maoDeObra.reduce((a, b) => a + (Number(b.quantidade) || 0), 0)}</strong> trabalhadores em <strong>{maoDeObra.length}</strong> funções
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Botão Seleção Automática em Lote (Checkboxes) */}
                  <button
                    type="button"
                    onClick={handleOpenQuickSelectModal}
                    className="text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-md border border-amber-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Selecione múltiplos cargos e funções com um clique para não precisar digitar um por um"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-amber-700" /> Seleção Automática de Cargos
                  </button>

                  {/* Preencher Equipe Padrão 1-Clique */}
                  <button
                    type="button"
                    onClick={handlePreencherEquipePadrao}
                    className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Preenche automaticamente com Engenheiro, Mestre, TST, Pedreiros e Serventes"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> Equipe Padrão
                  </button>

                  {/* Importar Colaboradores Cadastrados se houver */}
                  {colaboradores.some(c => c.ativo) && (
                    <button
                      type="button"
                      onClick={handleImportarColaboradoresCadastrados}
                      className="text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 px-2 py-1.5 rounded-md border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Importa todos os colaboradores ativos cadastrados no sistema"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" /> Do Cadastro
                    </button>
                  )}

                  {/* Adicionar Linha Individual */}
                  <button
                    type="button"
                    onClick={() => addMaoDeObraRow()}
                    className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Linha
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Desktop Column Header */}
                <div className="hidden sm:flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex-1">Função / Cargo</div>
                  <div className="w-48">Empresa / Subempreiteira</div>
                  <div className="w-16 text-center">Qtd</div>
                  <div className="w-36 text-center">Horas Extras</div>
                  <div className="w-7"></div>
                </div>

                {maoDeObra.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-500">Nenhuma mão de obra adicionada ainda ao relatório.</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleOpenQuickSelectModal}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ListPlus className="w-3.5 h-3.5" /> Selecionar Cargos Automaticamente
                      </button>
                      <button
                        type="button"
                        onClick={handlePreencherEquipePadrao}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" /> Povoar Equipe Padrão
                      </button>
                    </div>
                  </div>
                ) : (
                  maoDeObra.map((mo) => {
                    const hasHoraExtra = Boolean(mo.temHoraExtra || (mo.horasExtras && mo.horasExtras > 0));
                    const isCustomFuncao = Boolean(customFuncaoRows[mo.id]);
                    const isCustomEmpresa = Boolean(customEmpresaRows[mo.id]);

                    return (
                      <div key={mo.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                        {/* FUNÇÃO / CARGO */}
                        <div className="flex-1 min-w-[170px]">
                          {isCustomFuncao ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Digite o cargo livremente"
                                value={mo.funcao}
                                onChange={(e) => updateMaoDeObra(mo.id, 'funcao', e.target.value)}
                                className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setCustomFuncaoRows(prev => ({ ...prev, [mo.id]: false }))}
                                className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 shrink-0 whitespace-nowrap cursor-pointer"
                                title="Voltar para seleção com seta"
                              >
                                ← Lista
                              </button>
                            </div>
                          ) : (
                            <select
                              value={mo.funcao}
                              onChange={(e) => handleSelectFuncao(mo.id, e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value="">-- Selecione a Função / Cargo --</option>
                              {CATEGORIAS_CARGOS_PADRAO.map(cat => (
                                <optgroup key={cat.categoria} label={`📁 ${cat.categoria}`}>
                                  {cat.cargos.map(item => (
                                    <option key={item.cargo} value={item.cargo}>
                                      {item.cargo}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              {colabCargosExtras.length > 0 && (
                                <optgroup label="⭐ Cargos Cadastrados no Sistema">
                                  {colabCargosExtras.map(cargo => (
                                    <option key={cargo} value={cargo}>{cargo}</option>
                                  ))}
                                </optgroup>
                              )}
                              {mo.funcao && !TODOS_CARGOS_PADRAO.includes(mo.funcao) && !colabCargosExtras.includes(mo.funcao) && (
                                <optgroup label="✏️ Cargo Atual / Digitado">
                                  <option value={mo.funcao}>{mo.funcao}</option>
                                </optgroup>
                              )}
                              <option value="__custom__">+ Digitar outro cargo livremente...</option>
                            </select>
                          )}
                        </div>

                        {/* EMPRESA / SUBEMPREITEIRA */}
                        <div className="w-full sm:w-48">
                          {isCustomEmpresa ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Nome da empresa"
                                value={mo.empresa}
                                onChange={(e) => updateMaoDeObra(mo.id, 'empresa', e.target.value)}
                                className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setCustomEmpresaRows(prev => ({ ...prev, [mo.id]: false }))}
                                className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 shrink-0 whitespace-nowrap cursor-pointer"
                                title="Voltar para a seleção suspensa"
                              >
                                ← Lista
                              </button>
                            </div>
                          ) : (
                            <select
                              value={mo.empresa}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setCustomEmpresaRows(prev => ({ ...prev, [mo.id]: true }));
                                } else {
                                  updateMaoDeObra(mo.id, 'empresa', e.target.value);
                                }
                              }}
                              className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value="">-- Selecione a Empresa --</option>
                              {empresasMaoDeObra.map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                              ))}
                              {mo.empresa && !empresasMaoDeObra.includes(mo.empresa) && (
                                <option value={mo.empresa}>{mo.empresa}</option>
                              )}
                              <option value="__custom__">+ Digitar outra empresa...</option>
                            </select>
                          )}
                        </div>

                        {/* QUANTIDADE */}
                        <div className="w-16">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qtd"
                            value={mo.quantidade}
                            onChange={(e) => updateMaoDeObra(mo.id, 'quantidade', Math.max(1, Number(e.target.value)))}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 text-center font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            title="Quantidade de profissionais"
                          />
                        </div>

                        {/* HORAS EXTRAS */}
                        <div className="w-full sm:w-36 flex items-center justify-center">
                          <label
                            className={`w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded border text-xs cursor-pointer transition-all select-none ${
                              hasHoraExtra
                                ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-2xs'
                                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100/80 font-medium'
                            }`}
                            title="Tique se houver horas extras nesta função"
                          >
                            <input
                              type="checkbox"
                              checked={hasHoraExtra}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateMaoDeObra(mo.id, 'temHoraExtra', checked);
                                if (!checked) {
                                  updateMaoDeObra(mo.id, 'horasExtras', 0);
                                }
                              }}
                              className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                            />
                            <span className="whitespace-nowrap">Horas Extras</span>
                          </label>
                        </div>

                        {/* REMOVER LINHA */}
                        <button
                          type="button"
                          onClick={() => removeMaoDeObra(mo.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remover função"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MODAL DE SELEÇÃO AUTOMÁTICA / MÚLTIPLA DE CARGOS */}
              {showQuickSelectModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
                          <ListPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Seleção Automática de Cargos e Equipe</h3>
                          <p className="text-[11px] text-slate-300">
                            Marque os cargos presentes no canteiro hoje para inseri-los sem precisar escrever um por um.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQuickSelectModal(false)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Presets Bar */}
                    <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-900 text-[11px]">Atalhos rápidos:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const basicCargos = ['Engenheiro Residente', 'Mestre de Obras Geral', 'Técnico em Segurança do Trabalho', 'Pedreiro de Alvenaria', 'Servente de Obras'];
                            setQuickSelectedCargos(prev => {
                              const next = { ...prev };
                              Object.keys(next).forEach(k => { next[k] = { ...next[k], selected: false }; });
                              basicCargos.forEach(b => {
                                next[b] = { selected: true, qtd: next[b]?.qtd || (b.includes('Pedreiro') ? 6 : b.includes('Servente') ? 8 : 1) };
                              });
                              return next;
                            });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded border border-amber-300 text-[11px] transition-colors shadow-2xs cursor-pointer"
                        >
                          ⚡ Equipe Padrão Canteiro
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const estrutCargos = ['Pedreiro de Alvenaria', 'Servente de Obras', 'Carpinteiro de Fôrmas', 'Armador de Estruturas / Ferragens', 'Operador de Betoneira'];
                            setQuickSelectedCargos(prev => {
                              const next = { ...prev };
                              estrutCargos.forEach(b => {
                                next[b] = { selected: true, qtd: next[b]?.qtd || 4 };
                              });
                              return next;
                            });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded border border-amber-300 text-[11px] transition-colors shadow-2xs cursor-pointer"
                        >
                          🏗️ Estrutura & Alvenaria
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const instalCargos = ['Eletricista Instalador Predial', 'Encanador / Bombeiro Hidráulico', 'Pintor de Obras'];
                            setQuickSelectedCargos(prev => {
                              const next = { ...prev };
                              instalCargos.forEach(b => {
                                next[b] = { selected: true, qtd: next[b]?.qtd || 2 };
                              });
                              return next;
                            });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded border border-amber-300 text-[11px] transition-colors shadow-2xs cursor-pointer"
                        >
                          🔧 Instalações & Acabamento
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickSelectedCargos(prev => {
                              const next = { ...prev };
                              Object.keys(next).forEach(k => { next[k] = { ...next[k], selected: false }; });
                              return next;
                            });
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Desmarcar todos
                        </button>
                      </div>
                    </div>

                    {/* Scrollable list grouped by category */}
                    <div className="p-4 overflow-y-auto space-y-4 max-h-[50vh]">
                      {CATEGORIAS_CARGOS_PADRAO.map(cat => (
                        <div key={cat.categoria} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                            <span>{cat.categoria}</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              {cat.cargos.filter(c => quickSelectedCargos[c.cargo]?.selected).length} de {cat.cargos.length} selecionados
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cat.cargos.map(item => {
                              const isChecked = Boolean(quickSelectedCargos[item.cargo]?.selected);
                              const currentQtd = quickSelectedCargos[item.cargo]?.qtd || item.qtdPadrao;

                              return (
                                <div
                                  key={item.cargo}
                                  onClick={() => {
                                    setQuickSelectedCargos(prev => ({
                                      ...prev,
                                      [item.cargo]: {
                                        selected: !isChecked,
                                        qtd: currentQtd
                                      }
                                    }));
                                  }}
                                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    isChecked
                                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by parent div click
                                      className="w-4 h-4 rounded text-amber-600 border-slate-300 accent-amber-600 shrink-0 cursor-pointer"
                                    />
                                    <div className="truncate">
                                      <p className="text-xs leading-tight truncate">{item.cargo}</p>
                                      <span className="text-[10px] text-slate-500 font-normal">
                                        Empresa: {item.empresaPadrao}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quantidade input */}
                                  <div
                                    className="flex items-center gap-1 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <label className="text-[10px] text-slate-500">Qtd:</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={currentQtd}
                                      onChange={(e) => {
                                        const val = Math.max(1, Number(e.target.value) || 1);
                                        setQuickSelectedCargos(prev => ({
                                          ...prev,
                                          [item.cargo]: {
                                            selected: isChecked || true,
                                            qtd: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center text-xs font-bold border border-slate-300 rounded p-1 bg-white"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Cargos extras vindos de Colaboradores */}
                      {colabCargosExtras.length > 0 && (
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                            Cargos Cadastrados no Sistema
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {colabCargosExtras.map(cargo => {
                              const isChecked = Boolean(quickSelectedCargos[cargo]?.selected);
                              const currentQtd = quickSelectedCargos[cargo]?.qtd || 1;

                              return (
                                <div
                                  key={cargo}
                                  onClick={() => {
                                    setQuickSelectedCargos(prev => ({
                                      ...prev,
                                      [cargo]: {
                                        selected: !isChecked,
                                        qtd: currentQtd
                                      }
                                    }));
                                  }}
                                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    isChecked
                                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-amber-600 border-slate-300 accent-amber-600 shrink-0 cursor-pointer"
                                    />
                                    <div className="truncate">
                                      <p className="text-xs leading-tight truncate">{cargo}</p>
                                    </div>
                                  </div>

                                  <div
                                    className="flex items-center gap-1 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <label className="text-[10px] text-slate-500">Qtd:</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={currentQtd}
                                      onChange={(e) => {
                                        const val = Math.max(1, Number(e.target.value) || 1);
                                        setQuickSelectedCargos(prev => ({
                                          ...prev,
                                          [cargo]: {
                                            selected: true,
                                            qtd: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center text-xs font-bold border border-slate-300 rounded p-1 bg-white"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Total selecionado:{' '}
                        <strong className="text-slate-900 font-bold">
                          {(Object.values(quickSelectedCargos) as { selected: boolean; qtd: number }[]).filter(v => v?.selected).length}
                        </strong>{' '}
                        funções
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickSelectModal(false)}
                          className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyQuickSelect(false)}
                          className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                          title="Acrescenta os selecionados à lista existente"
                        >
                          + Adicionar à Lista
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyQuickSelect(true)}
                          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-sm cursor-pointer"
                          title="Substitui a lista de mão de obra atual exatamente pelos selecionados"
                        >
                          ✓ Definir Efetivo Selecionado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('atividades')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('equipamentos')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Próximo: Equipamentos →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: EQUIPAMENTOS */}
          {activeSection === 'equipamentos' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  5. Equipamentos e Máquinas Alocados
                </h4>
                <button
                  type="button"
                  onClick={addEquipamentoRow}
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Equipamento
                </button>
              </div>

              <div className="space-y-2">
                {equipamentosAlocados.map((eq) => (
                  <div key={eq.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex-1 min-w-[160px]">
                      <input
                        type="text"
                        placeholder="Nome do Equipamento (ex: Betoneira)"
                        value={eq.nome}
                        onChange={(e) => updateEquipamento(eq.id, 'nome', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-medium"
                      />
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        min={1}
                        placeholder="Qtd"
                        value={eq.quantidade}
                        onChange={(e) => updateEquipamento(eq.id, 'quantidade', Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 text-center font-bold"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={eq.status}
                        onChange={(e) => updateEquipamento(eq.id, 'status', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                      >
                        <option value="operando">Operando</option>
                        <option value="parado">Parado</option>
                        <option value="manutencao">Manutenção</option>
                      </select>
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Horas"
                        value={eq.horasTrabalhadas}
                        onChange={(e) => updateEquipamento(eq.id, 'horasTrabalhadas', Number(e.target.value))}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEquipamento(eq.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('maodeobra')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('ocorrencias')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Próximo: Ocorrências →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: OCORRÊNCIAS */}
          {activeSection === 'ocorrencias' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  6. Ocorrências, Interferências e Visitas Técnicas
                </h4>
                <button
                  type="button"
                  onClick={addOcorrencia}
                  className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Ocorrência
                </button>
              </div>

              {ocorrencias.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">Nenhuma ocorrência registrada para este dia. O dia transcorreu normalmente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ocorrencias.map((oc, idx) => (
                    <div key={oc.id} className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900">Ocorrência #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeOcorrencia(oc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tipo</label>
                          <select
                            value={oc.tipo}
                            onChange={(e) => updateOcorrencia(oc.id, 'tipo', e.target.value as TipoOcorrencia)}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white"
                          >
                            <option value="material">Falta / Atraso de Material</option>
                            <option value="fornecedor">Atraso de Fornecedor</option>
                            <option value="visita_tecnica">Visita Técnica / Cliente</option>
                            <option value="fiscalizacao">Fiscalização Oficial</option>
                            <option value="projeto">Dúvida / Interferência de Projeto</option>
                            <option value="acidente">Incidente / Segurança</option>
                            <option value="outro">Outro Fato Relevante</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Severidade</label>
                          <select
                            value={oc.severidade}
                            onChange={(e) => updateOcorrencia(oc.id, 'severidade', e.target.value as SeveridadeOcorrencia)}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white"
                          >
                            <option value="baixa">Baixa (Informativa)</option>
                            <option value="media">Média (Atenção)</option>
                            <option value="alta">Alta (Crítica / Paralisação)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Título Resumido</label>
                          <input
                            type="text"
                            placeholder="Ex: Atraso na entrega de aço"
                            value={oc.titulo}
                            onChange={(e) => updateOcorrencia(oc.id, 'titulo', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Descrição do Fato</label>
                        <textarea
                          rows={2}
                          placeholder="Relate o ocorrido com clareza."
                          value={oc.descricao}
                          onChange={(e) => updateOcorrencia(oc.id, 'descricao', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ação Corretiva / Adotada</label>
                        <input
                          type="text"
                          placeholder="Ex: Solicitado novo lote para entrega prioritária amanhã às 8h."
                          value={oc.acaoTomada}
                          onChange={(e) => updateOcorrencia(oc.id, 'acaoTomada', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('equipamentos')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('fotos')}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Próximo: Registro Fotográfico →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: FOTOS */}
          {activeSection === 'fotos' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    7. Relatório Fotográfico do Dia ({fotos.length} fotos anexadas)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tire fotos instantâneas na obra usando a câmera do celular ou importe da galeria
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>
                      Destino das fotos diárias: <strong>{DriveAndFolderService.getConfig().drivePhotosSubfolder || 'Acervo Fotográfico'}</strong> (Drive) e <strong>{DriveAndFolderService.getConfig().localPhotosSubfolder || 'Fotos_Diarias'}</strong> (Notebook)
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Botão de Câmera Instantânea */}
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        startCamera('environment');
                      } else if (mobileCameraInputRef.current) {
                        mobileCameraInputRef.current.click();
                      }
                    }}
                    className="text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                    title="Abrir a câmera do celular para tirar foto instantaneamente"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tirar Foto com a Câmera</span>
                  </button>

                  {/* Input direto da câmera mobile nativa com capture="environment" */}
                  <input
                    ref={mobileCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* Botão Importar Galeria / Arquivos */}
                  <label className="cursor-pointer text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Importar da Galeria</span>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Viewfinder da Câmera em Tempo Real (Mobile e Desktop) */}
              {isCameraActive && (
                <div className="p-4 bg-slate-950 rounded-2xl border-2 border-amber-500 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Camera className="w-4 h-4" />
                        Câmera de Campo Ativa
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={switchCameraFacing}
                        className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1"
                        title="Alternar entre câmera traseira e frontal"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Inverter Câmera</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                        title="Fechar Câmera"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-video sm:aspect-4/3 max-h-[380px] w-full bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder grid lines */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-amber-500/20">
                      <div className="border-r border-b border-amber-500/20" />
                      <div className="border-r border-b border-amber-500/20" />
                      <div className="border-b border-amber-500/20" />
                      <div className="border-r border-b border-amber-500/20" />
                      <div className="border-r border-b border-amber-500/20 flex items-center justify-center">
                        <div className="w-10 h-10 border-2 border-amber-400/60 rounded-full" />
                      </div>
                      <div className="border-b border-amber-500/20" />
                      <div className="border-r border-amber-500/20" />
                      <div className="border-r border-amber-500/20" />
                      <div />
                    </div>

                    {cameraLoading && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                        <span className="text-xs font-semibold">Conectando sensor da câmera...</span>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center justify-between">
                      <span>{cameraError}</span>
                      <button
                        type="button"
                        onClick={() => mobileCameraInputRef.current?.click()}
                        className="underline font-bold text-amber-400 ml-2"
                      >
                        Abrir Câmera Nativa
                      </button>
                    </div>
                  )}

                  {/* Controles do Disparador */}
                  <div className="flex items-center justify-center gap-4 pt-1 pb-2">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="text-xs text-slate-400 hover:text-white px-4 py-2"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={capturePhotoFromCamera}
                      className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg border-4 border-white/20 active:scale-90 transition-all cursor-pointer"
                      title="Capturar Foto Instantânea"
                    >
                      <Camera className="w-7 h-7" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        mobileCameraInputRef.current?.click();
                      }}
                      className="text-xs text-amber-400 hover:underline px-3 py-1"
                    >
                      Usar Câmera Nativa
                    </button>
                  </div>
                </div>
              )}

              {fotos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Nenhuma foto adicionada ainda</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                      Você pode tirar fotos em tempo real no canteiro de obras com seu celular ou selecionar fotos da sua galeria para compor o relatório fotográfico no PDF.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                          startCamera('environment');
                        } else if (mobileCameraInputRef.current) {
                          mobileCameraInputRef.current.click();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all"
                    >
                      <Camera className="w-4 h-4" /> Tirar Foto Agora
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-all"
                    >
                      <Upload className="w-4 h-4 text-amber-400" /> Escolher da Galeria
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fotos.map((foto, idx) => (
                    <div key={foto.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Foto #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFoto(foto.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Excluir Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="h-36 w-full rounded-lg overflow-hidden bg-slate-200 border border-slate-300 relative">
                        <img 
                          src={foto.url} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          {foto.horario || 'Registro'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600">Legenda da Foto (Aparecerá no PDF) *</label>
                          <input
                            type="text"
                            placeholder="Ex: Concretagem da laje com caminhão betoneira"
                            value={foto.legenda}
                            onChange={(e) => updateFoto(foto.id, 'legenda', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Etapa Vinculada</label>
                            <select
                              value={foto.etapa || ''}
                              onChange={(e) => updateFoto(foto.id, 'etapa', e.target.value)}
                              className="w-full text-[11px] border border-slate-300 rounded p-1 bg-white font-medium text-slate-800"
                            >
                              <option value="Registro Geral da Obra">Registro Geral da Obra</option>
                              {currentObra?.etapas?.map((et, i) => (
                                <option key={`foto-obra-et-${i}`} value={et}>{et}</option>
                              ))}
                              {ETAPAS_CATEGORIZADAS.map((cat, cIdx) => (
                                <optgroup key={`foto-cat-${cIdx}`} label={cat.categoria}>
                                  {cat.itens.map((item, iIdx) => (
                                    <option key={`foto-cat-${cIdx}-item-${iIdx}`} value={item}>{item}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Horário do Registro</label>
                            <input
                              type="text"
                              placeholder="14:30"
                              value={foto.horario || ''}
                              onChange={(e) => updateFoto(foto.id, 'horario', e.target.value)}
                              className="w-full text-[11px] border border-slate-300 rounded p-1 bg-white font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('ocorrencias')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* Modal Bottom Final Submit */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Obra: <strong>{currentObra?.nome || 'Selecione a obra'}</strong> | Data: <strong>{data || '-'}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs shadow-md transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                {editingRdo ? 'Salvar Alterações do RDO' : 'Finalizar e Emitir RDO'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
