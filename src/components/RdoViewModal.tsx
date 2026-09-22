import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Edit, 
  Calendar, 
  CloudSun, 
  Users, 
  Wrench, 
  AlertTriangle, 
  Camera, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Printer,
  ChevronRight,
  Maximize2,
  Cloud,
  HardDrive
} from 'lucide-react';
import { RelatorioDiarioObra, Obra } from '../types';
import { DriveAndFolderService } from '../services/driveAndFolderService';
import { getCachedDriveAccessToken, loginWithGoogle } from '../firebase';
import { obterPdfBlob } from '../services/pdfService';

interface RdoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdo: RelatorioDiarioObra | null;
  obra?: Obra;
  onDownloadPdf: (rdo: RelatorioDiarioObra) => void;
  onShareRdo: (rdo: RelatorioDiarioObra) => void;
  onEditRdo: (rdo: RelatorioDiarioObra) => void;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  canEdit?: boolean;
}

export const RdoViewModal: React.FC<RdoViewModalProps> = ({
  isOpen,
  onClose,
  rdo,
  obra,
  onDownloadPdf,
  onShareRdo,
  onEditRdo,
  onShowToast,
  canEdit = true
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSavingToFolder, setIsSavingToFolder] = useState(false);

  if (!isOpen || !rdo) return null;

  const handleSaveToDriveDirect = async () => {
    try {
      setIsSavingToDrive(true);
      let token = getCachedDriveAccessToken();
      if (!token) {
        const loginRes = await loginWithGoogle();
        if (loginRes?.cancelled) {
          onShowToast?.('Janela de login Google fechada.', 'info');
          return;
        }
        token = loginRes?.accessToken || getCachedDriveAccessToken();
      }

      if (!token) {
        onShowToast?.('Conexão com Google Drive necessária para enviar o arquivo.', 'info');
        return;
      }

      onShowToast?.('Gerando PDF e enviando para o Google Drive...', 'info');
      const storageCfg = DriveAndFolderService.getConfig();
      const pdfSubfolder = storageCfg.drivePdfSubfolder?.trim() || 'Relatórios em PDF';
      const photoSubfolder = storageCfg.drivePhotosSubfolder?.trim() || 'Acervo Fotográfico';
      const obraName = obra?.nome || 'Obra';

      const rootFolderId = await DriveAndFolderService.resolveDriveTargetFolder(storageCfg, token);
      let baseFolderId = rootFolderId;
      if (storageCfg.driveOrganizeByObra !== false) {
        baseFolderId = await DriveAndFolderService.getOrCreateDriveFolder(obraName, token, rootFolderId);
      }
      const pdfsFolderId = await DriveAndFolderService.getOrCreateDriveFolder(pdfSubfolder, token, baseFolderId);

      const { blob, fileName } = await obterPdfBlob(rdo, obra);
      const res = await DriveAndFolderService.uploadFileToDrive(fileName, 'application/pdf', blob, token, pdfsFolderId);

      // Also send photos to Drive photo folder if present
      let photosUploaded = 0;
      if (rdo.fotos && rdo.fotos.length > 0) {
        const fotosFolderId = await DriveAndFolderService.getOrCreateDriveFolder(photoSubfolder, token, baseFolderId);
        for (let f = 0; f < rdo.fotos.length; f++) {
          const foto = rdo.fotos[f];
          if (foto.url && foto.url.startsWith('data:image')) {
            try {
              const fotoBlob = DriveAndFolderService.dataUrlToBlob(foto.url);
              const fotoName = `Foto_RDO_${String(rdo.numero).padStart(3, '0')}_${f + 1}.jpg`;
              await DriveAndFolderService.uploadFileToDrive(fotoName, 'image/jpeg', fotoBlob, token, fotosFolderId);
              photosUploaded++;
            } catch (errFoto) {
              console.warn('Erro ao salvar foto individual:', errFoto);
            }
          }
        }
      }

      const msgFotos = photosUploaded > 0 ? ` e ${photosUploaded} fotos salvas em "${photoSubfolder}"` : '';
      onShowToast?.(`PDF do RDO salvo em "${pdfSubfolder}"${msgFotos} no Google Drive!`, 'success');
    } catch (err: any) {
      console.error('Erro ao enviar para o Drive:', err);
      onShowToast?.(err.message || 'Erro ao enviar para o Google Drive.', 'error');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleSaveToLocalFolderDirect = async () => {
    try {
      setIsSavingToFolder(true);
      const storageCfg = DriveAndFolderService.getConfig();
      const pdfSubfolder = storageCfg.localPdfSubfolder?.trim() || 'Relatórios_PDF';
      const photoSubfolder = storageCfg.localPhotosSubfolder?.trim() || 'Fotos_Diarias';
      const obraName = obra?.nome || 'Obra';

      const pdfRelPath = storageCfg.localOrganizeByObra !== false
        ? `${obraName}/${pdfSubfolder}`
        : pdfSubfolder;

      const photoRelPath = storageCfg.localOrganizeByObra !== false
        ? `${obraName}/${photoSubfolder}`
        : photoSubfolder;

      const { blob, fileName } = await obterPdfBlob(rdo, obra);
      const res = await DriveAndFolderService.saveFileToLocalFolder(fileName, blob, pdfRelPath);

      let photosSaved = 0;
      if (rdo.fotos && rdo.fotos.length > 0) {
        for (let f = 0; f < rdo.fotos.length; f++) {
          const foto = rdo.fotos[f];
          if (foto.url && foto.url.startsWith('data:image')) {
            try {
              const fotoBlob = DriveAndFolderService.dataUrlToBlob(foto.url);
              const fotoName = `Foto_RDO_${String(rdo.numero).padStart(3, '0')}_${f + 1}.jpg`;
              await DriveAndFolderService.saveFileToLocalFolder(fotoName, fotoBlob, photoRelPath);
              photosSaved++;
            } catch (errFoto) {
              console.warn('Erro ao salvar foto local:', errFoto);
            }
          }
        }
      }

      if (res.success) {
        const msgFotos = photosSaved > 0 ? ` + ${photosSaved} fotos em "${photoSubfolder}"` : '';
        onShowToast?.(`Arquivos salvos: PDF em "${pdfSubfolder}"${msgFotos}!`, 'success');
      }
    } catch (err: any) {
      console.error('Erro ao salvar localmente:', err);
      onShowToast?.('Erro ao salvar na pasta do notebook.', 'error');
    } finally {
      setIsSavingToFolder(false);
    }
  };

  const dataFormatada = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';

  const formatClima = (c?: string) => {
    switch (c) {
      case 'claro_ensolarado': return 'Ensolarado / Claro';
      case 'parcialmente_nublado': return 'Parcialmente Nublado';
      case 'nublado': return 'Nublado';
      case 'chuva_fraca': return 'Chuva Fraca';
      case 'chuva_forte': return 'Chuva Forte';
      default: return 'Normal';
    }
  };

  const getPratBadge = (prat?: string) => {
    switch (prat) {
      case 'praticavel':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">PRATICÁVEL</span>;
      case 'parcialmente_praticavel':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">PARCIALMENTE PRATICÁVEL</span>;
      case 'impraticavel':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">IMPRATICÁVEL</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">PRATICÁVEL</span>;
    }
  };

  const totalTrabalhadores = rdo.maoDeObra ? rdo.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-sm tracking-wider">
              RDO Nº {String(rdo.numero).padStart(3, '0')}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
                {obra?.nome || 'Diário de Obra'}
              </h2>
              <p className="text-xs text-slate-300">
                Data: {dataFormatada} ({rdo.diaSemana}) • Dia {rdo.diasDecorridos || '-'} do cronograma
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleSaveToDriveDirect}
              disabled={isSavingToDrive}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-colors border border-amber-500/30"
              title="Salvar PDF no Google Drive"
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden md:inline">{isSavingToDrive ? 'Enviando...' : 'Salvar no Drive'}</span>
            </button>

            <button
              onClick={handleSaveToLocalFolderDirect}
              disabled={isSavingToFolder}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-colors border border-sky-500/30"
              title="Salvar PDF na pasta do notebook"
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden md:inline">{isSavingToFolder ? 'Gravando...' : 'Pasta Notebook'}</span>
            </button>

            <button
              onClick={() => onDownloadPdf(rdo)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
              title="Gerar e Baixar PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              onClick={() => onShareRdo(rdo)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEditRdo(rdo);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                title="Editar RDO"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 bg-slate-50/50">
          
          {/* Work / Project Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] block">Contratante / Cliente</span>
              <span className="font-bold text-slate-800 text-sm">{obra?.cliente || '-'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] block">Responsável Técnico</span>
              <span className="font-bold text-slate-800">{rdo.responsavelTecnico || obra?.responsavelTecnico || '-'}</span>
              <span className="text-[11px] text-slate-500 block">{rdo.creaCau || obra?.creaCau || '-'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] block">Elaborador do Diário</span>
              <span className="font-bold text-slate-800">{rdo.elaboradoPor || 'Mestre de Obras'}</span>
              {rdo.vistoFiscalizacao && (
                <span className="text-[11px] text-slate-500 block">Fiscal: {rdo.vistoFiscalizacao}</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] block">Local da Obra</span>
              <span className="font-medium text-slate-700 line-clamp-2">
                {obra ? `${obra.endereco}, ${obra.cidade}/${obra.estado}` : '-'}
              </span>
            </div>
          </div>

          {/* 1. Condições Climáticas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-amber-500" />
                1. Condições Climáticas e Praticabilidade
              </h4>
              {getPratBadge(rdo.clima.praticabilidade)}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Manhã</span>
                <span className="font-bold text-slate-800">{formatClima(rdo.clima.manha)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Tarde</span>
                <span className="font-bold text-slate-800">{formatClima(rdo.clima.tarde)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Noite</span>
                <span className="font-bold text-slate-800">{formatClima(rdo.clima.noite)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-3 sm:col-span-1">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Temp. / Paralisação</span>
                <span className="font-bold text-slate-800">
                  {rdo.clima.temperaturaMin ?? '--'}°C a {rdo.clima.temperaturaMax ?? '--'}°C
                </span>
                <span className="text-[11px] text-rose-600 block font-medium">
                  {rdo.clima.impactoChuvaHoras ? `${rdo.clima.impactoChuvaHoras}h paradas` : '0h paradas por chuva'}
                </span>
              </div>
            </div>

            {rdo.clima.observacaoClima && (
              <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-md border border-amber-100">
                "{rdo.clima.observacaoClima}"
              </p>
            )}
          </div>

          {/* 2. Mão de Obra */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                2. Mão de Obra Efetiva em Campo
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Total: {totalTrabalhadores} profissionais
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Função / Especialidade</th>
                    <th className="py-2 px-3">Empresa / Frente</th>
                    <th className="py-2 px-3 text-center">Quantidade</th>
                    <th className="py-2 px-3 text-center">Horas Extras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rdo.maoDeObra && rdo.maoDeObra.length > 0 ? (
                    rdo.maoDeObra.map((mo, idx) => {
                      const hasHoraExtra = Boolean(mo.temHoraExtra || (mo.horasExtras && mo.horasExtras > 0));
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{mo.funcao}</td>
                          <td className="py-2 px-3 text-slate-600">{mo.empresa || 'Própria'}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">{mo.quantidade}</td>
                          <td className="py-2 px-3 text-center">
                            {hasHoraExtra ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ✓ Sim
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Não</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-slate-400">Nenhum registro de mão de obra.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Equipamentos */}
          {rdo.equipamentos && rdo.equipamentos.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  3. Equipamentos e Maquinário Utilizados
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {rdo.equipamentos.map((eq, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{eq.nome}</span>
                      <span className="text-[11px] text-slate-500">{eq.quantidade} un. • {eq.horasTrabalhadas || 8}h de uso</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      eq.status === 'operando' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {eq.status === 'operando' ? 'Operando' : eq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Atividades Executadas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                4. Etapas e Serviços Executados no Dia
              </h4>
            </div>

            <div className="space-y-3">
              {rdo.atividades && rdo.atividades.length > 0 ? (
                rdo.atividades.map((atv, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{atv.etapa}</span>
                        {atv.localizacao && (
                          <span className="text-[11px] bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200 font-medium">
                            {atv.localizacao}
                          </span>
                        )}
                      </div>
                      {atv.progressoPercentual !== undefined && (
                        <span className="text-xs font-extrabold text-amber-600">
                          {atv.progressoPercentual}% concluído
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line pl-7">
                      {atv.descricao}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Nenhuma atividade especificada.</p>
              )}
            </div>
          </div>

          {/* 5. Ocorrências */}
          {rdo.ocorrencias && rdo.ocorrencias.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  5. Ocorrências, Interferências e Acidentes
                </h4>
              </div>

              <div className="space-y-2.5">
                {rdo.ocorrencias.map((oc, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900">{oc.titulo}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        oc.severidade === 'alta' ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900'
                      }`}>
                        Gravidade {oc.severidade}
                      </span>
                    </div>
                    <p className="text-slate-700"><strong>Fato:</strong> {oc.descricao}</p>
                    {oc.acaoTomada && (
                      <p className="text-emerald-800 bg-white/80 p-2 rounded border border-rose-100">
                        <strong>Ação Adotada:</strong> {oc.acaoTomada}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Fotos do Dia */}
          {rdo.fotos && rdo.fotos.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" />
                  6. Relatório Fotográfico ({rdo.fotos.length} fotos)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {rdo.fotos.map((foto, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedPhoto(foto.url)}
                    className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="h-44 w-full overflow-hidden bg-slate-200 relative">
                      <img 
                        src={foto.url} 
                        alt={foto.legenda} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-6 h-6" />
                      </div>
                      {foto.horario && (
                        <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          {foto.horario}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white text-xs">
                      <p className="font-semibold text-slate-900 line-clamp-2">{foto.legenda}</p>
                      {foto.etapa && (
                        <span className="text-[10px] text-amber-700 font-medium mt-1 inline-block">
                          Etapa: {foto.etapa}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Observações Gerais */}
          {rdo.observacoesGerais && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                Observações Gerais / DDS (Diálogo Diário de Segurança)
              </h4>
              <p className="text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                {rdo.observacoesGerais}
              </p>
            </div>
          )}

          {/* 8. Responsáveis e Assinaturas */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] mb-6">
              Assinaturas e Responsabilidade Técnica
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-2 max-w-xs mx-auto">
                  <p className="font-bold text-slate-900">{rdo.responsavelTecnico || obra?.responsavelTecnico || 'Engenheiro Residente'}</p>
                  <p className="text-[11px] text-slate-500">{rdo.creaCau || obra?.creaCau || 'CREA / CAU'}</p>
                  <p className="text-[10px] text-slate-400">Responsável Técnico pela Obra</p>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-400 pt-2 max-w-xs mx-auto">
                  <p className="font-bold text-slate-900">{rdo.vistoFiscalizacao || obra?.cliente || 'Fiscalização / Contratante'}</p>
                  <p className="text-[11px] text-slate-500">Visto de Ciência e Recebimento</p>
                  <p className="text-[10px] text-slate-400">Representante do Cliente / Gerenciadora</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Última atualização: {new Date(rdo.updatedAt || rdo.createdAt).toLocaleString('pt-BR')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => onDownloadPdf(rdo)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Baixar Documento PDF
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox for single photo */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img 
            src={selectedPhoto} 
            alt="Ampliada" 
            referrerPolicy="no-referrer"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}

    </div>
  );
};
