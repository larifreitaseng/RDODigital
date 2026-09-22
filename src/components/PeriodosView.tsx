import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Clock, 
  Building2, 
  FileText, 
  Download, 
  HardHat, 
  CloudSun, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FolderSync, 
  Layers, 
  Eye, 
  Share2, 
  Sparkles,
  Search,
  Filter,
  Users,
  Sun,
  CloudRain,
  Cloud,
  Check
} from 'lucide-react';
import { RelatorioDiarioObra, Obra } from '../types';
import { baixarPdfPeriodo, obterPdfPeriodoBlob, baixarPdfRdo } from '../services/pdfService';
import { DriveAndFolderService } from '../services/driveAndFolderService';

export type TipoPeriodo = 'dia' | 'semana' | 'mes' | 'ano';

interface PeriodosViewProps {
  rdos: RelatorioDiarioObra[];
  obras: Obra[];
  onViewRdo: (rdo: RelatorioDiarioObra) => void;
  onNewRdoForDate?: (data: string, obraId?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const PeriodosView: React.FC<PeriodosViewProps> = ({
  rdos,
  obras,
  onViewRdo,
  onNewRdoForDate,
  onShowToast
}) => {
  // Navigation State
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes');
  const [selectedObraId, setSelectedObraId] = useState<string>('todas');
  
  // Today's date reference
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Specific period selections
  const [selectedDate, setSelectedDate] = useState<string>(todayStr); // for 'dia'
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(todayStr); // anchor for 'semana'
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Processing state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Map of obras for fast lookup
  const obrasMap = useMemo(() => {
    const map: Record<string, Obra> = {};
    obras.forEach(o => { map[o.id] = o; });
    return map;
  }, [obras]);

  // Calculate start and end dates based on tipoPeriodo
  const { dataInicio, dataFim, tituloPeriodo, subtituloPeriodo } = useMemo(() => {
    if (tipoPeriodo === 'dia') {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const diaFormatado = selectedDate.split('-').reverse().join('/');
      const diaSemanaNome = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      const diaSemanaCapitalized = diaSemanaNome.charAt(0).toUpperCase() + diaSemanaNome.slice(1);

      return {
        dataInicio: selectedDate,
        dataFim: selectedDate,
        tituloPeriodo: `Diário do Dia ${diaFormatado}`,
        subtituloPeriodo: diaSemanaCapitalized
      };
    }

    if (tipoPeriodo === 'semana') {
      const parts = selectedWeekDate.split('-');
      const anchor = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      // Calculate Monday (day 1) and Sunday (day 7)
      const dayOfWeek = anchor.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const monday = new Date(anchor);
      monday.setDate(anchor.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatYMD = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const ini = formatYMD(monday);
      const fim = formatYMD(sunday);
      const iniFmt = ini.split('-').reverse().join('/');
      const fimFmt = fim.split('-').reverse().join('/');

      // Week number in year
      const firstDayOfYear = new Date(monday.getFullYear(), 0, 1);
      const pastDaysOfYear = (monday.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

      return {
        dataInicio: ini,
        dataFim: fim,
        tituloPeriodo: `Semana ${weekNum} de ${monday.getFullYear()}`,
        subtituloPeriodo: `${iniFmt} a ${fimFmt}`
      };
    }

    if (tipoPeriodo === 'mes') {
      const year = selectedYear;
      const month = selectedMonth; // 0-11
      const lastDay = new Date(year, month + 1, 0).getDate();
      
      const mStr = String(month + 1).padStart(2, '0');
      const ini = `${year}-${mStr}-01`;
      const fim = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

      return {
        dataInicio: ini,
        dataFim: fim,
        tituloPeriodo: `${MESES[month]} de ${year}`,
        subtituloPeriodo: `01/${mStr}/${year} a ${lastDay}/${mStr}/${year}`
      };
    }

    // 'ano'
    const year = selectedYear;
    return {
      dataInicio: `${year}-01-01`,
      dataFim: `${year}-12-31`,
      tituloPeriodo: `Ano de ${year}`,
      subtituloPeriodo: `01/01/${year} a 31/12/${year}`
    };
  }, [tipoPeriodo, selectedDate, selectedWeekDate, selectedMonth, selectedYear]);

  // Filter RDOs matching the selected period and obra
  const filteredRdos = useMemo(() => {
    return rdos.filter(r => {
      // Date filter
      if (!r.data) return false;
      if (r.data < dataInicio || r.data > dataFim) return false;

      // Obra filter
      if (selectedObraId !== 'todas' && r.obraId !== selectedObraId) {
        return false;
      }

      return true;
    }).sort((a, b) => (b.data || '').localeCompare(a.data || '')); // Newest first
  }, [rdos, dataInicio, dataFim, selectedObraId]);

  // Selected Obra details
  const selectedObra = selectedObraId !== 'todas' ? obrasMap[selectedObraId] : undefined;

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalOperariosHomensDia = 0;
    let diasPraticaveis = 0;
    let diasImpraticaveis = 0;
    let totalFotos = 0;
    let totalOcorrencias = 0;

    filteredRdos.forEach(r => {
      const op = r.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
      totalOperariosHomensDia += op;
      if (r.condicaoPraticavel === 'praticavel' || !r.condicaoPraticavel) {
        diasPraticaveis++;
      } else {
        diasImpraticaveis++;
      }
      totalFotos += r.fotos?.length || 0;
      totalOcorrencias += r.ocorrencias?.length || 0;
    });

    const mediaEfetivo = filteredRdos.length > 0 ? (totalOperariosHomensDia / filteredRdos.length).toFixed(1) : '0';

    return {
      totalRdos: filteredRdos.length,
      totalOperariosHomensDia,
      mediaEfetivo,
      diasPraticaveis,
      diasImpraticaveis,
      totalFotos,
      totalOcorrencias
    };
  }, [filteredRdos]);

  // Navigation handlers
  const handleNavPrev = () => {
    if (tipoPeriodo === 'dia') {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } else if (tipoPeriodo === 'semana') {
      const parts = selectedWeekDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() - 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedWeekDate(`${y}-${m}-${day}`);
    } else if (tipoPeriodo === 'mes') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else {
      setSelectedYear(prev => prev - 1);
    }
  };

  const handleNavNext = () => {
    if (tipoPeriodo === 'dia') {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } else if (tipoPeriodo === 'semana') {
      const parts = selectedWeekDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedWeekDate(`${y}-${m}-${day}`);
    } else if (tipoPeriodo === 'mes') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    } else {
      setSelectedYear(prev => prev + 1);
    }
  };

  const handleNavToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const dStr = now.toISOString().split('T')[0];
    setSelectedDate(dStr);
    setSelectedWeekDate(dStr);
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  // PDF Download of Period
  const handleDownloadPeriodPdf = async () => {
    if (filteredRdos.length === 0) {
      onShowToast('Nenhum diário encontrado no período selecionado para gerar o PDF.', 'info');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      await baixarPdfPeriodo({
        tipo: tipoPeriodo,
        tituloPeriodo,
        subtituloPeriodo,
        dataInicio,
        dataFim,
        rdos: filteredRdos,
        obra: selectedObra,
        obrasMap
      });
      onShowToast(`PDF do período (${tituloPeriodo}) baixado com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao baixar PDF do período:', err);
      onShowToast('Falha ao gerar o PDF do período. Tente novamente.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Save to Local Folder or Google Drive
  const handleSavePeriodPdf = async () => {
    if (filteredRdos.length === 0) {
      onShowToast('Nenhum diário encontrado no período para salvar.', 'info');
      return;
    }

    setIsSavingPdf(true);
    try {
      const { blob, fileName } = await obterPdfPeriodoBlob({
        tipo: tipoPeriodo,
        tituloPeriodo,
        subtituloPeriodo,
        dataInicio,
        dataFim,
        rdos: filteredRdos,
        obra: selectedObra,
        obrasMap
      });

      const config = DriveAndFolderService.getConfig();
      let savedLocation = '';

      // Check Google Drive
      const driveToken = localStorage.getItem('google_drive_access_token');
      if (config.saveToDrive && driveToken) {
        const parentFolderId = await DriveAndFolderService.resolveDriveTargetFolder(config, driveToken);
        let pdfFolderId = parentFolderId;
        if (config.drivePdfSubfolder) {
          pdfFolderId = await DriveAndFolderService.getOrCreateDriveFolder(config.drivePdfSubfolder, driveToken, parentFolderId);
        }
        await DriveAndFolderService.uploadFileToDrive(fileName, 'application/pdf', blob, driveToken, pdfFolderId);
        savedLocation += `Google Drive (${config.driveFolderName || 'Pasta Raiz'})`;
      }

      // Check Local Folder
      if (DriveAndFolderService.hasActiveDirectoryHandle()) {
        const subfolder = config.localPdfSubfolder || 'Relatórios_PDF';
        await DriveAndFolderService.saveFileToLocalFolder(fileName, blob, subfolder);
        savedLocation += (savedLocation ? ' e ' : '') + `Pasta do PC (${config.localFolderName})`;
      } else {
        // Fallback: direct download save
        DriveAndFolderService.downloadBlobInBrowser(fileName, blob);
        savedLocation += (savedLocation ? ' e ' : '') + 'Downloads';
      }

      onShowToast(`Relatório em PDF do período salvo com sucesso em: ${savedLocation || 'seu dispositivo'}!`, 'success');
    } catch (err: any) {
      console.error('Erro ao salvar PDF do período:', err);
      onShowToast(`Falha ao salvar: ${err.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setIsSavingPdf(false);
    }
  };

  // Batch download of each individual daily PDF
  const handleDownloadBatchIndividual = async () => {
    if (filteredRdos.length === 0) {
      onShowToast('Nenhum RDO encontrado no período.', 'info');
      return;
    }

    setIsDownloadingBatch(true);
    setBatchProgress({ current: 0, total: filteredRdos.length });

    try {
      for (let i = 0; i < filteredRdos.length; i++) {
        const rdo = filteredRdos[i];
        const obra = obrasMap[rdo.obraId];
        await baixarPdfRdo(rdo, obra);
        setBatchProgress({ current: i + 1, total: filteredRdos.length });
        // small pause between downloads to prevent browser throttling
        await new Promise(res => setTimeout(res, 400));
      }
      onShowToast(`Todos os ${filteredRdos.length} diários em PDF foram baixados individualmente!`, 'success');
    } catch (err) {
      console.error('Erro no download em lote:', err);
      onShowToast('Ocorreu um erro durante o download dos arquivos em lote.', 'error');
    } finally {
      setIsDownloadingBatch(false);
      setBatchProgress(null);
    }
  };

  const getClimaBadge = (clima?: string, condicao?: string) => {
    const isImpraticavel = condicao === 'impraticavel';
    if (isImpraticavel) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
          <CloudRain className="w-3 h-3 text-rose-600" />
          Impraticável
        </span>
      );
    }
    if (clima === 'claro_ensolarado') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          <Sun className="w-3 h-3 text-amber-500" />
          Praticável
        </span>
      );
    }
    if (clima === 'nublado') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
          <Cloud className="w-3 h-3 text-slate-500" />
          Praticável
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
        <Sun className="w-3 h-3 text-sky-500" />
        Praticável
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs tracking-wider uppercase">
            <CalendarRange className="w-4 h-4" />
            <span>Relatórios e Períodos de Obra</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Filtrar por Período e Exportar PDF
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selecione o período (dia, semana, mês ou ano) para visualizar os diários e gerar o relatório consolidado em PDF.
          </p>
        </div>

        {/* Global Save / Quick info badge */}
        <div className="flex items-center gap-2">
          {filteredRdos.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{filteredRdos.length} diário(s) pronto(s) para emissão</span>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & PERIOD SELECTOR CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        
        {/* Row 1: Tipo de Período Tabs e Seletor de Obra */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Tipo de Período Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
            <button
              id="tab-periodo-dia"
              onClick={() => setTipoPeriodo('dia')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tipoPeriodo === 'dia'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Dia</span>
            </button>

            <button
              id="tab-periodo-semana"
              onClick={() => setTipoPeriodo('semana')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tipoPeriodo === 'semana'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>

            <button
              id="tab-periodo-mes"
              onClick={() => setTipoPeriodo('mes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tipoPeriodo === 'mes'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>

            <button
              id="tab-periodo-ano"
              onClick={() => setTipoPeriodo('ano')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tipoPeriodo === 'ano'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ano</span>
            </button>
          </div>

          {/* Seletor de Obra */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Obra:
            </span>
            <select
              id="select-obra-periodo"
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none w-full md:w-64 transition-colors"
            >
              <option value="todas">Todas as Obras ({obras.length})</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Navegador Dinâmico do Período */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          
          {/* Navigation buttons and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              <button
                id="btn-periodo-prev"
                onClick={handleNavPrev}
                title="Período anterior"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-periodo-today"
                onClick={handleNavToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hoje / Atual
              </button>
              <button
                id="btn-periodo-next"
                onClick={handleNavNext}
                title="Próximo período"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Formatted Period Heading */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {tituloPeriodo}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {subtituloPeriodo}
                </span>
              </div>
            </div>
          </div>

          {/* Date Picker Controls according to Period Type */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {tipoPeriodo === 'dia' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Data exata:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>
            )}

            {tipoPeriodo === 'semana' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Semana de referência:</label>
                <input
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>
            )}

            {tipoPeriodo === 'mes' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                >
                  {MESES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoPeriodo === 'ano' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Ano:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Action Buttons (Baixar PDF do Período, Salvar no Drive/Pasta, Baixar Lote) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-5 -mb-5 p-4 rounded-b-2xl">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{filteredRdos.length}</span>
            <span>diário(s) encontrado(s) para este período.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* 1. Botão Baixar PDF Consolidado */}
            <button
              id="btn-baixar-pdf-periodo"
              onClick={handleDownloadPeriodPdf}
              disabled={isGeneratingPdf || filteredRdos.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                filteredRdos.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>
                {isGeneratingPdf 
                  ? 'Gerando Relatório...' 
                  : `Baixar PDF do ${tipoPeriodo === 'dia' ? 'Dia' : tipoPeriodo === 'semana' ? 'Semana' : tipoPeriodo === 'mes' ? 'Mês' : 'Ano'}`
                }
              </span>
            </button>

            {/* 2. Botão Salvar PDF no Drive / Pasta */}
            <button
              id="btn-salvar-pdf-periodo"
              onClick={handleSavePeriodPdf}
              disabled={isSavingPdf || filteredRdos.length === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                filteredRdos.length === 0
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 active:scale-95'
              }`}
              title="Salva na pasta configurada do computador ou no Google Drive"
            >
              <FolderSync className={`w-3.5 h-3.5 text-amber-600 ${isSavingPdf ? 'animate-spin' : ''}`} />
              <span>{isSavingPdf ? 'Salvando...' : 'Salvar no Drive ou Pasta'}</span>
            </button>

            {/* 3. Botão Baixar Diários Individuais em Lote */}
            {filteredRdos.length > 1 && (
              <button
                id="btn-baixar-lote-individuais"
                onClick={handleDownloadBatchIndividual}
                disabled={isDownloadingBatch}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 transition-colors"
                title="Baixa cada diário em arquivo PDF separado"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isDownloadingBatch && batchProgress
                    ? `Baixando (${batchProgress.current}/${batchProgress.total})...`
                    : 'Baixar Diários Individuais'
                  }
                </span>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* KPI METRIC CARDS OF THE SELECTED PERIOD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total RDOs */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Diários Registrados</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.totalRdos}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalRdos === 1 ? '1 dia com diário emitido' : `${metrics.totalRdos} dias documentados`}
          </div>
        </div>

        {/* Efetivo Médio e Homens-Dia */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Efetivo de Obra</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.mediaEfetivo} <span className="text-xs font-normal text-slate-500">op/dia</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Total de {metrics.totalOperariosHomensDia} homens-dia
          </div>
        </div>

        {/* Condições Climáticas / Praticabilidade */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Praticabilidade</span>
            <CloudSun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.diasPraticaveis} <span className="text-xs font-normal text-emerald-600">praticáveis</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.diasImpraticaveis > 0 ? `${metrics.diasImpraticaveis} dia(s) impraticável` : 'Sem paralisações por chuva'}
          </div>
        </div>

        {/* Fotos e Ocorrências */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Registros de Campo</span>
            <Camera className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.totalFotos} <span className="text-xs font-normal text-slate-500">fotos</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalOcorrencias > 0 ? `${metrics.totalOcorrencias} ocorrência(s)` : 'Sem ocorrências críticas'}
          </div>
        </div>

      </div>

      {/* RDOs LIST OF THE PERIOD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Diários do Período ({filteredRdos.length})</span>
            {selectedObra && (
              <span className="text-xs font-medium text-slate-500">
                • {selectedObra.nome}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            Ordenados do mais recente para o mais antigo
          </span>
        </div>

        {filteredRdos.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Nenhum diário encontrado para este período
              </h3>
              <p className="text-xs text-slate-500">
                Não há registros de RDO emitidos entre {dataInicio.split('-').reverse().join('/')} e {dataFim.split('-').reverse().join('/')}
                {selectedObraId !== 'todas' ? ` na obra ${selectedObra?.nome || ''}` : ''}.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onNewRdoForDate && tipoPeriodo === 'dia' && (
                <button
                  onClick={() => onNewRdoForDate(selectedDate, selectedObraId !== 'todas' ? selectedObraId : undefined)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  + Emitir RDO para {selectedDate.split('-').reverse().join('/')}
                </button>
              )}
              <button
                onClick={handleNavToday}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Ir para o Período Atual
              </button>
            </div>
          </div>
        ) : (
          /* Cards List (matches style shown in user's image) */
          <div className="space-y-3">
            {filteredRdos.map(rdo => {
              const obra = obrasMap[rdo.obraId];
              const totalOperarios = rdo.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
              const dataFormatada = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';
              const principaisAtividades = rdo.atividades.slice(0, 2).map(a => `${a.local ? `${a.local}: ` : ''}${a.descricao}`).join(' • ');

              return (
                <div 
                  key={rdo.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Left: Badge + Obra + Info Pill */}
                    <div className="flex items-start gap-3.5">
                      {/* RDO Number Badge */}
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                        <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider leading-none">RDO</span>
                        <span className="text-sm leading-tight text-white">#{String(rdo.numero).padStart(3, '0')}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {obra?.nome || 'Obra não informada'}
                          </h3>
                          {rdo.diaSemana && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {rdo.diaSemana}
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {dataFormatada}
                          </span>

                          {rdo.diasDecorridos !== undefined && (
                            <span>• Dia {rdo.diasDecorridos}</span>
                          )}

                          <span>• {getClimaBadge(rdo.climaManha, rdo.condicaoPraticavel)}</span>

                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {totalOperarios} operários
                          </span>

                          {rdo.fotos && rdo.fotos.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-slate-400" />
                              {rdo.fotos.length} fotos
                            </span>
                          )}

                          {rdo.ocorrencias && rdo.ocorrencias.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              {rdo.ocorrencias.length} ocorrência(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action buttons (Ver, Baixar PDF) */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <button
                        onClick={() => onViewRdo(rdo)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Ver detalhes do diário"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await baixarPdfRdo(rdo, obra);
                            onShowToast(`PDF do RDO #${rdo.numero} baixado!`, 'success');
                          } catch (e) {
                            onShowToast('Erro ao baixar PDF individual.', 'error');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-colors"
                        title="Baixar PDF deste dia"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar PDF</span>
                      </button>
                    </div>

                  </div>

                  {/* Summary of activities */}
                  {principaisAtividades && (
                    <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-800">Serviços do dia: </span>
                      <span>{principaisAtividades}</span>
                    </div>
                  )}

                  {/* Photo thumbnails preview if available */}
                  {rdo.fotos && rdo.fotos.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {rdo.fotos.slice(0, 5).map((foto, fIdx) => (
                        <div 
                          key={foto.id || fIdx}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative group cursor-pointer"
                          onClick={() => onViewRdo(rdo)}
                        >
                          <img 
                            src={foto.url} 
                            alt={foto.legenda || 'Foto do RDO'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                      {rdo.fotos.length > 5 && (
                        <div 
                          onClick={() => onViewRdo(rdo)}
                          className="w-14 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 cursor-pointer shrink-0"
                        >
                          +{rdo.fotos.length - 5} fotos
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
