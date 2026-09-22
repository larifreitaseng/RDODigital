import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RelatorioDiarioObra, Obra } from '../types';

// Helper to convert image URL to base64 for jsPDF
async function getImageDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      // Timeout guard
      setTimeout(() => resolve(null), 4000);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export async function gerarPdfRdo(rdo: RelatorioDiarioObra, obra?: Obra): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Primary colors
  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const secondaryColor: [number, number, number] = [217, 119, 6]; // Amber 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  // Safe text truncation helper to guarantee that text NEVER overflows printable/card limits
  const fitText = (text: string | undefined | null, maxWidth: number): string => {
    if (!text) return '-';
    const str = String(text);
    if (doc.getTextWidth(str) <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 3 && doc.getTextWidth(truncated + '...') > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  // 1. HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('RELATÓRIO DIÁRIO DE OBRA - RDO', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('REGISTRO OFICIAL DE DIÁRIO E CONTROLE DE CAMPO', margin + 6, currentY + 15);

  // RDO Number pill
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(pageWidth - margin - 38, currentY + 3, 34, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`RDO Nº ${String(rdo.numero).padStart(3, '0')}`, pageWidth - margin - 21, currentY + 11.5, { align: 'center' });

  currentY += 23;

  // 2. INFORMAÇÕES DA OBRA E DO DIA (Grid balanceado em 2 colunas com margens e limites rigorosos)
  const cardHeight = 28;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

  // Linha divisória vertical sutil no meio do card
  const colDividerX = margin + (contentWidth / 2);
  doc.setDrawColor(226, 232, 240);
  doc.line(colDividerX, currentY + 3, colDividerX, currentY + cardHeight - 3);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);

  const col1X = margin + 4;
  const colAvailable = (contentWidth / 2) - 8; // ~83mm disponível por coluna

  // Coluna Esquerda: Obra, Cliente, Local, Resp. Técnico
  doc.setFont('helvetica', 'bold');
  doc.text('OBRA:', col1X, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(obra?.nome || 'Obra não especificada', colAvailable - 13), col1X + 13, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', col1X, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(obra?.cliente || 'Cliente não informado', colAvailable - 17), col1X + 17, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('LOCAL:', col1X, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  const localStr = obra ? `${obra.endereco} - ${obra.cidade}/${obra.estado}` : '-';
  doc.text(fitText(localStr, colAvailable - 14), col1X + 14, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('RESP. TÉCNICO:', col1X, currentY + 23.5);
  doc.setFont('helvetica', 'normal');
  const respTecnicoStr = `${rdo.responsavelTecnico || obra?.responsavelTecnico || '-'} | ${rdo.creaCau || obra?.creaCau || '-'}`;
  doc.text(fitText(respTecnicoStr, colAvailable - 26), col1X + 26, currentY + 23.5);

  // Coluna Direita: Data, Dias Decorridos, Elaborado Por, Status Obra
  const col2X = colDividerX + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('DATA:', col2X, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  const dataFormatada = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';
  doc.text(fitText(`${dataFormatada} (${rdo.diaSemana || ''})`, colAvailable - 12), col2X + 12, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DIAS DECORRIDOS:', col2X, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(`${rdo.diasDecorridos || '-'} dias`, colAvailable - 30), col2X + 30, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('ELABORADO POR:', col2X, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(rdo.elaboradoPor || 'Mestre de Obras', colAvailable - 28), col2X + 28, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS OBRA:', col2X, currentY + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(`${obra?.progressoEstimado || 0}% de avanço físico`, colAvailable - 24), col2X + 24, currentY + 23.5);

  currentY += cardHeight + 4;

  // 3. CONDIÇÕES CLIMÁTICAS E PRATICABILIDADE
  const formatClima = (c?: string) => {
    switch (c) {
      case 'claro_ensolarado': return 'Ensolarado';
      case 'parcialmente_nublado': return 'Parc. Nublado';
      case 'nublado': return 'Nublado';
      case 'chuva_fraca': return 'Chuva Fraca';
      case 'chuva_forte': return 'Chuva Forte';
      default: return 'Normal';
    }
  };

  const formatPrat = (p?: string) => {
    switch (p) {
      case 'praticavel': return 'PRATICÁVEL';
      case 'parcialmente_praticavel': return 'PARCIALMENTE PRATICÁVEL';
      case 'impraticavel': return 'IMPRATICÁVEL';
      default: return 'PRATICÁVEL';
    }
  };

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['1. CONDIÇÕES CLIMÁTICAS E PRATICABILIDADE DA OBRA', 'MANHÃ', 'TARDE', 'NOITE', 'PRATICABILIDADE']],
    body: [
      [
        `Temp: ${rdo.clima.temperaturaMin ?? '--'}°C a ${rdo.clima.temperaturaMax ?? '--'}°C | Chuva: ${rdo.clima.impactoChuvaHoras ?? 0}h paradas\nObs: ${rdo.clima.observacaoClima || 'Sem impedimentos climáticos.'}`,
        formatClima(rdo.clima.manha),
        formatClima(rdo.clima.tarde),
        formatClima(rdo.clima.noite),
        formatPrat(rdo.clima.praticabilidade)
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 34, halign: 'center', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 4. MÃO DE OBRA E EQUIPAMENTOS (Side-by-side or consecutive tables)
  const totalTrabalhadores = rdo.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
  const maoDeObraRows = rdo.maoDeObra.map(m => {
    const hasHoraExtra = Boolean(m.temHoraExtra || (m.horasExtras && m.horasExtras > 0));
    return [
      m.funcao,
      m.empresa || 'Própria',
      String(m.quantidade),
      hasHoraExtra ? 'Sim' : 'Não'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`2. MÃO DE OBRA EFETIVA EM CAMPO (Total: ${totalTrabalhadores} profissionais)`, 'Empresa / Equipe', 'Qtd', 'Horas Extras']],
    body: maoDeObraRows.length > 0 ? maoDeObraRows : [['Nenhum colaborador registrado', '-', '0', '-']],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 54 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Equipamentos
  if (rdo.equipamentos && rdo.equipamentos.length > 0) {
    const equipRows = rdo.equipamentos.map(e => [
      e.nome,
      String(e.quantidade),
      e.status === 'operando' ? 'Em Operação' : e.status === 'parado' ? 'Parado' : 'Manutenção',
      `${e.horasTrabalhadas || 8}h`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['3. EQUIPAMENTOS E MÁQUINAS NO CANTEIRO', 'Qtd', 'Situação', 'Horas Uso']],
      body: equipRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // Check page height before Atividades
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = margin;
  }

  // 5. ATIVIDADES E SERVIÇOS EXECUTADOS
  const atvRows = rdo.atividades.map((a, idx) => [
    `${idx + 1}. ${a.etapa}` + (a.localizacao ? `\n[Local: ${a.localizacao}]` : ''),
    a.descricao,
    a.progressoPercentual !== undefined ? `${a.progressoPercentual}%` : '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['4. ETAPAS E SERVIÇOS EXECUTADOS NO DIA', 'Descrição Detalhada do Avanço Físico', 'Avanço']],
    body: atvRows.length > 0 ? atvRows : [['Geral', 'Trabalhos regulares de canteiro.', '-']],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 114 },
      2: { cellWidth: 20, halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 6. OCORRÊNCIAS E INTERFERÊNCIAS
  if (rdo.ocorrencias && rdo.ocorrencias.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    const ocRows = rdo.ocorrencias.map(o => [
      `[${o.severidade.toUpperCase()}] ${o.titulo}`,
      `Fato: ${o.descricao}\nAção Adotada: ${o.acaoTomada || 'Em acompanhamento'}`,
      o.resolvida ? 'Resolvida' : 'Em Aberto'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['5. OCORRÊNCIAS, IMPEDIMENTOS E INTERFERÊNCIAS', 'Descrição e Ação Preventiva/Corretiva', 'Status']],
      body: ocRows,
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 107 },
        2: { cellWidth: 25, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // 7. OBSERVAÇÕES GERAIS
  if (rdo.observacoesGerais) {
    const obsLines = doc.splitTextToSize(rdo.observacoesGerais, contentWidth - 10);
    const boxHeight = Math.max(16, 7 + (obsLines.length * 3.6));

    if (currentY + boxHeight > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('OBSERVAÇÕES GERAIS / SEGURANÇA DO TRABALHO:', margin + 4, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(obsLines, margin + 4, currentY + 9.5);

    currentY += boxHeight + 4;
  }

  // 8. RELATÓRIO FOTOGRÁFICO
  if (rdo.fotos && rdo.fotos.length > 0) {
    // Photos typically deserve their own clean page
    doc.addPage();
    currentY = margin;

    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('RELATÓRIO FOTOGRÁFICO DO DIA', margin + 4, currentY + 5.5);
    currentY += 12;

    const imgWidth = 85;
    const imgHeight = 60;
    const spacingX = 12;
    const spacingY = 14;

    for (let i = 0; i < rdo.fotos.length; i++) {
      const foto = rdo.fotos[i];
      const col = i % 2;
      const row = Math.floor(i / 2) % 3;

      if (i > 0 && i % 6 === 0) {
        doc.addPage();
        currentY = margin;
        doc.setFillColor(...primaryColor);
        doc.rect(margin, currentY, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('RELATÓRIO FOTOGRÁFICO DO DIA (CONTINUAÇÃO)', margin + 4, currentY + 5.5);
        currentY += 12;
      }

      const x = margin + col * (imgWidth + spacingX);
      const y = currentY + row * (imgHeight + spacingY);

      // Frame box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, imgWidth, imgHeight, 'FD');

      // Attempt to load and render photo
      try {
        const base64Img = await getImageDataUrl(foto.url);
        if (base64Img) {
          doc.addImage(base64Img, 'JPEG', x + 1, y + 1, imgWidth - 2, imgHeight - 14);
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('[Registro Fotográfico]', x + imgWidth / 2, y + 22, { align: 'center' });
        }
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('[Registro Fotográfico]', x + imgWidth / 2, y + 22, { align: 'center' });
      }

      // Legend banner
      doc.setFillColor(241, 245, 249);
      doc.rect(x, y + imgHeight - 13, imgWidth, 13, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      const legendaText = foto.legenda || (foto.etapa ? `Registro da etapa: ${foto.etapa}` : 'Foto de acompanhamento');
      const splitLegenda = doc.splitTextToSize(`Foto ${i + 1}: ${legendaText}`, imgWidth - 4);
      doc.text(splitLegenda, x + 2, y + imgHeight - 9);

      if (foto.horario) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Horário: ${foto.horario}`, x + 2, y + imgHeight - 2);
      }
    }

    currentY += Math.ceil(Math.min(rdo.fotos.length, 6) / 2) * (imgHeight + spacingY);
  }

  // 9. ASSINATURAS E RESPONSABILIDADES TÉCNICAS
  const sigHeightNeeded = 28;
  if (currentY + sigHeightNeeded > pageHeight - 16) {
    doc.addPage();
    currentY = margin + 10;
  } else {
    currentY = Math.max(currentY + 4, pageHeight - 40);
  }

  const sigBoxWidth = (contentWidth - 14) / 2;

  // Signatures block
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, currentY + 12, margin + 4 + sigBoxWidth, currentY + 12);
  doc.line(margin + sigBoxWidth + 14, currentY + 12, margin + contentWidth - 4, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    fitText(rdo.responsavelTecnico || obra?.responsavelTecnico || 'Engenheiro Responsável', sigBoxWidth - 4),
    margin + 4 + sigBoxWidth / 2,
    currentY + 16,
    { align: 'center' }
  );
  doc.text(
    fitText(rdo.vistoFiscalizacao || obra?.cliente || 'Fiscalização / Contratante', sigBoxWidth - 4),
    margin + sigBoxWidth + 14 + sigBoxWidth / 2,
    currentY + 16,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    fitText(rdo.creaCau || obra?.creaCau || 'CREA / CAU', sigBoxWidth - 4),
    margin + 4 + sigBoxWidth / 2,
    currentY + 20,
    { align: 'center' }
  );
  doc.text(
    'Visto de Ciência e Recebimento',
    margin + sigBoxWidth + 14 + sigBoxWidth / 2,
    currentY + 20,
    { align: 'center' }
  );

  // 10. FOOTER ON ALL PAGES
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.text(
      `RDO Nº ${String(rdo.numero).padStart(3, '0')} - ${obra?.nome || 'Diário de Obras'} | Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      margin,
      pageHeight - 4
    );

    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 4,
      { align: 'right' }
    );
  }

  return doc;
}

export interface OpcoesPdfPeriodo {
  tipo: 'dia' | 'semana' | 'mes' | 'ano';
  tituloPeriodo: string;
  subtituloPeriodo: string;
  dataInicio: string;
  dataFim: string;
  rdos: RelatorioDiarioObra[];
  obra?: Obra;
  obrasMap?: Record<string, Obra>;
}

export async function gerarPdfConsolidadoPeriodo(opcoes: OpcoesPdfPeriodo): Promise<jsPDF> {
  const { tipo, tituloPeriodo, subtituloPeriodo, dataInicio, dataFim, rdos, obra, obrasMap = {} } = opcoes;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const secondaryColor: [number, number, number] = [217, 119, 6]; // Amber 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  const fitText = (text: string | undefined | null, maxWidth: number): string => {
    if (!text) return '-';
    const str = String(text);
    if (doc.getTextWidth(str) <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 3 && doc.getTextWidth(truncated + '...') > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  // Sort RDOs chronologically
  const sortedRdos = [...rdos].sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  // 1. CAPA / CABEÇALHO DO PERÍODO
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  let bannerTitle = 'RELATÓRIO CONSOLIDADO DE OBRA';
  if (tipo === 'dia') bannerTitle = 'RELATÓRIO DIÁRIO CONSOLIDADO';
  if (tipo === 'semana') bannerTitle = 'RELATÓRIO SEMANAL DE OBRA (RSO)';
  if (tipo === 'mes') bannerTitle = 'RELATÓRIO MENSAL DE OBRA (RMO)';
  if (tipo === 'ano') bannerTitle = 'RELATÓRIO ANUAL DE OBRA';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(bannerTitle, margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(fitText(`${tituloPeriodo} • ${subtituloPeriodo}`, contentWidth - 45), margin + 6, currentY + 16);

  // Period Badge
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(pageWidth - margin - 36, currentY + 4, 32, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(tipo.toUpperCase(), pageWidth - margin - 20, currentY + 11, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`${rdos.length} ${rdos.length === 1 ? 'RDO' : 'RDOs'}`, pageWidth - margin - 20, currentY + 16.5, { align: 'center' });

  currentY += 27;

  // 2. DADOS DA OBRA / IDENTIFICAÇÃO DO CONTRATO
  const cardHeight = 26;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

  const colDividerX = margin + (contentWidth / 2);
  doc.setDrawColor(226, 232, 240);
  doc.line(colDividerX, currentY + 3, colDividerX, currentY + cardHeight - 3);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  const col1X = margin + 4;
  const colAvailable = (contentWidth / 2) - 8;

  // Coluna 1
  doc.setFont('helvetica', 'bold');
  doc.text('OBRA:', col1X, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(obra?.nome || 'Todas as Obras Registradas', colAvailable - 13), col1X + 13, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', col1X, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(obra?.cliente || (obra ? 'Não especificado' : 'Múltiplos clientes'), colAvailable - 17), col1X + 17, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('LOCAL:', col1X, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  const localStr = obra ? `${obra.endereco || ''} - ${obra.cidade || ''}/${obra.estado || ''}` : 'Canteiros cadastrados';
  doc.text(fitText(localStr, colAvailable - 14), col1X + 14, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('RESP. TÉCNICO:', col1X, currentY + 23.5);
  doc.setFont('helvetica', 'normal');
  const respStr = obra ? `${obra.responsavelTecnico || '-'} (${obra.creaCau || 'CREA'})` : 'Engenharia e Gestão Técnica';
  doc.text(fitText(respStr, colAvailable - 26), col1X + 26, currentY + 23.5);

  // Coluna 2
  const col2X = colDividerX + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO:', col2X, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  const inicioFmt = dataInicio ? dataInicio.split('-').reverse().join('/') : '-';
  const fimFmt = dataFim ? dataFim.split('-').reverse().join('/') : '-';
  doc.text(fitText(`${inicioFmt} até ${fimFmt}`, colAvailable - 18), col2X + 18, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIOS EMITIDOS:', col2X, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(`${rdos.length} diários no período selecionado`, colAvailable - 32), col2X + 32, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('EMISSÃO DO PDF:', col2X, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  const hoje = new Date().toLocaleDateString('pt-BR');
  doc.text(fitText(`${hoje} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, colAvailable - 28), col2X + 28, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS DA OBRA:', col2X, currentY + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(obra?.status ? obra.status.toUpperCase() : 'ATIVO', colAvailable - 30), col2X + 30, currentY + 23.5);

  currentY += cardHeight + 4;

  // 3. INDICADORES DO PERÍODO (Cards de Resumo)
  let totalTrabalhadoresHomensDia = 0;
  let diasPraticaveis = 0;
  let diasImpraticaveis = 0;
  let totalFotos = 0;
  let totalOcorrencias = 0;

  sortedRdos.forEach(r => {
    const qtdOperarios = r.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
    totalTrabalhadoresHomensDia += qtdOperarios;
    const isImprat = r.clima?.praticabilidade === 'impraticavel';
    if (isImprat) {
      diasImpraticaveis++;
    } else {
      diasPraticaveis++;
    }
    totalFotos += r.fotos?.length || 0;
    totalOcorrencias += r.ocorrencias?.length || 0;
  });

  const mediaEfetivoDia = sortedRdos.length > 0 ? (totalTrabalhadoresHomensDia / sortedRdos.length).toFixed(1) : '0';

  const kpiWidth = (contentWidth - 12) / 4;
  const kpiHeight = 16;

  const kpis = [
    { title: 'DIÁRIOS EMITIDOS', val: `${sortedRdos.length}`, sub: 'Registros no período' },
    { title: 'EFETIVO MÉDIO', val: `${mediaEfetivoDia} op/dia`, sub: `${totalTrabalhadoresHomensDia} homens-dia` },
    { title: 'PRATICABILIDADE', val: `${diasPraticaveis} prat.`, sub: `${diasImpraticaveis} impraticável` },
    { title: 'FOTOS E OCORRÊNCIAS', val: `${totalFotos} fotos`, sub: `${totalOcorrencias} ocorrências` }
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + 4);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, kpiX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, kpiX + 3, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, kpiX + 3, currentY + 14);
  });

  currentY += kpiHeight + 5;

  // 4. TABELA CRONOLÓGICA DOS DIÁRIOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('1. CRONOLOGIA DOS DIÁRIOS DO PERÍODO', margin, currentY + 3);
  currentY += 5;

  const formatClima = (c?: string) => {
    switch (c) {
      case 'claro_ensolarado': return 'Ensolarado';
      case 'parcialmente_nublado': return 'Parc. Nublado';
      case 'nublado': return 'Nublado';
      case 'chuva_fraca': return 'Chuva Fraca';
      case 'chuva_forte': return 'Chuva Forte';
      default: return 'Bom';
    }
  };

  const cronologiaRows = sortedRdos.map(r => {
    const dataFmt = r.data ? r.data.split('-').reverse().join('/') : '-';
    const totalOp = r.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
    const climaStr = `${formatClima(r.clima?.manha)} (${r.clima?.praticabilidade === 'impraticavel' ? 'Imprat.' : 'Prat.'})`;
    const obraNome = obrasMap[r.obraId]?.nome || obra?.nome || 'Obra';
    const servicos = r.atividades.map(a => a.descricao).join('; ') || '-';
    const ocorrenciasCount = r.ocorrencias?.length || 0;

    return [
      dataFmt,
      `#${String(r.numero).padStart(3, '0')}`,
      fitText(obraNome, 30),
      r.diaSemana || '-',
      climaStr,
      `${totalOp} op.`,
      fitText(servicos, 65),
      ocorrenciasCount > 0 ? `${ocorrenciasCount} reg.` : 'Nenhuma'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'RDO', 'Obra', 'Dia Sem.', 'Clima', 'Oper.', 'Principais Serviços', 'Ocorrências']],
    body: cronologiaRows.length > 0 ? cronologiaRows : [['-', '-', '-', '-', '-', '-', 'Nenhum RDO encontrado neste período.', '-']],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. MÃO DE OBRA CONSOLIDADA POR FUNÇÃO NO PERÍODO
  const rolesMap: Record<string, { quantidadeTotalHomensDia: number; empresa: string }> = {};
  sortedRdos.forEach(r => {
    r.maoDeObra.forEach(m => {
      const key = m.funcao.trim().toUpperCase();
      if (!rolesMap[key]) {
        rolesMap[key] = {
          quantidadeTotalHomensDia: 0,
          empresa: m.empresa || 'Própria'
        };
      }
      rolesMap[key].quantidadeTotalHomensDia += Number(m.quantidade) || 0;
    });
  });

  const rolesRows = Object.entries(rolesMap)
    .sort((a, b) => b[1].quantidadeTotalHomensDia - a[1].quantidadeTotalHomensDia)
    .map(([funcao, dados]) => [
      funcao,
      dados.empresa,
      `${dados.quantidadeTotalHomensDia} homens-dia`,
      sortedRdos.length > 0 ? `${(dados.quantidadeTotalHomensDia / sortedRdos.length).toFixed(1)} op/dia` : '-'
    ]);

  if (rolesRows.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text('2. MÃO DE OBRA CONSOLIDADA POR FUNÇÃO NO PERÍODO', margin, currentY + 3);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Função / Especialidade', 'Empresa / Vínculo', 'Total Homens-Dia Acumulado', 'Média Efetivo Diário']],
      body: rolesRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [71, 85, 105], // Slate 600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 45, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 6. DETALHAMENTO DAS ATIVIDADES E FOTOS DIÁRIAS DOS RDOS
  if (sortedRdos.length > 0) {
    for (const rdo of sortedRdos) {
      doc.addPage();
      currentY = margin;

      // Header of daily sheet
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'F');

      const dataFmt = rdo.data ? rdo.data.split('-').reverse().join('/') : '-';
      const obraNome = obrasMap[rdo.obraId]?.nome || obra?.nome || 'Obra';

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.text(`RDO Nº ${String(rdo.numero).padStart(3, '0')} • ${dataFmt} (${rdo.diaSemana || ''})`, margin + 4, currentY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(fitText(obraNome, 70), pageWidth - margin - 4, currentY + 8, { align: 'right' });

      currentY += 15;

      // Resumo do dia: Clima e Mão de Obra
      const totalOpDia = rdo.maoDeObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
      const praticabilidadeStr = rdo.clima?.praticabilidade === 'impraticavel' ? 'Impraticável' : 'Praticável';
      const resumoDiaText = `Condição: ${formatClima(rdo.clima?.manha)} | Praticabilidade: ${praticabilidadeStr} | Efetivo Total: ${totalOpDia} operários | Elaborado por: ${rdo.elaboradoPor || 'Mestre de Obras'}`;

      doc.setFillColor(...lightBg);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(fitText(resumoDiaText, contentWidth - 6), margin + 3, currentY + 5.5);

      currentY += 11;

      // Atividades do dia
      const atividadesRows = rdo.atividades.map(a => [
        a.localizacao || 'Geral',
        a.descricao,
        `${a.progressoPercentual || 0}%`,
        a.etapa || '-'
      ]);

      if (atividadesRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Local / Frente', 'Descrição dos Serviços Executados', 'Progresso', 'Etapa']],
          body: atividadesRows,
          theme: 'grid',
          styles: {
            fontSize: 7.5,
            cellPadding: 2,
            textColor: [51, 65, 85],
            lineColor: [226, 232, 240],
            lineWidth: 0.2
          },
          headStyles: {
            fillColor: [51, 65, 85],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5
          },
          columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 40 }
          },
          margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
      }

      // Ocorrências do dia
      if (rdo.ocorrencias && rdo.ocorrencias.length > 0) {
        const ocorrenciasRows = rdo.ocorrencias.map(o => [
          o.tipo.toUpperCase(),
          o.titulo ? `${o.titulo}: ${o.descricao}` : o.descricao,
          o.severidade.toUpperCase(),
          o.acaoTomada || '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Tipo de Ocorrência', 'Descrição do Apontamento', 'Severidade', 'Providência Adotada']],
          body: ocorrenciasRows,
          theme: 'grid',
          styles: {
            fontSize: 7.5,
            cellPadding: 2,
            textColor: [51, 65, 85],
            lineColor: [226, 232, 240],
            lineWidth: 0.2
          },
          headStyles: {
            fillColor: [180, 83, 9], // Amber dark
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 45 }
          },
          margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
      }

      // Fotos do dia (se houver)
      if (rdo.fotos && rdo.fotos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...primaryColor);
        doc.text(`Acervo Fotográfico do Dia (${rdo.fotos.length} fotos)`, margin, currentY + 3);
        currentY += 5;

        // Render images in 2-column layout
        const maxFotosParaRenderizar = Math.min(rdo.fotos.length, 6);
        const photoWidth = (contentWidth - 6) / 2;
        const photoHeight = 44;

        for (let i = 0; i < maxFotosParaRenderizar; i += 2) {
          if (currentY + photoHeight + 10 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }

          const foto1 = rdo.fotos[i];
          const foto2 = rdo.fotos[i + 1];

          // Foto 1
          if (foto1) {
            const dataUrl = await getImageDataUrl(foto1.url);
            if (dataUrl) {
              doc.addImage(dataUrl, 'JPEG', margin, currentY, photoWidth, photoHeight, undefined, 'FAST');
            } else {
              doc.setFillColor(241, 245, 249);
              doc.rect(margin, currentY, photoWidth, photoHeight, 'F');
              doc.setTextColor(148, 163, 184);
              doc.setFontSize(8);
              doc.text('Foto indisponível', margin + photoWidth / 2, currentY + photoHeight / 2, { align: 'center' });
            }
            doc.setFillColor(15, 23, 42);
            doc.rect(margin, currentY + photoHeight - 6, photoWidth, 6, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.text(fitText(foto1.legenda || foto1.etapa || 'Registro de campo', photoWidth - 4), margin + 2, currentY + photoHeight - 2);
          }

          // Foto 2
          if (foto2) {
            const foto2X = margin + photoWidth + 6;
            const dataUrl2 = await getImageDataUrl(foto2.url);
            if (dataUrl2) {
              doc.addImage(dataUrl2, 'JPEG', foto2X, currentY, photoWidth, photoHeight, undefined, 'FAST');
            } else {
              doc.setFillColor(241, 245, 249);
              doc.rect(foto2X, currentY, photoWidth, photoHeight, 'F');
              doc.setTextColor(148, 163, 184);
              doc.setFontSize(8);
              doc.text('Foto indisponível', foto2X + photoWidth / 2, currentY + photoHeight / 2, { align: 'center' });
            }
            doc.setFillColor(15, 23, 42);
            doc.rect(foto2X, currentY + photoHeight - 6, photoWidth, 6, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.text(fitText(foto2.legenda || foto2.etapa || 'Registro de campo', photoWidth - 4), foto2X + 2, currentY + photoHeight - 2);
          }

          currentY += photoHeight + 4;
        }
      }
    }
  }

  // 7. RODAPÉ EM TODAS AS PÁGINAS COM NUMERAÇÃO
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Relatório Periódico Consolidado • RDO Digital Engenharia • Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
      margin,
      pageHeight - 4
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 4,
      { align: 'right' }
    );
  }

  return doc;
}

export async function baixarPdfPeriodo(opcoes: OpcoesPdfPeriodo): Promise<void> {
  const doc = await gerarPdfConsolidadoPeriodo(opcoes);
  const prefix = opcoes.tipo.toUpperCase();
  const inicioLimpa = (opcoes.dataInicio || '').replace(/-/g, '');
  const fimLimpa = (opcoes.dataFim || '').replace(/-/g, '');
  const nomeObraCurto = (opcoes.obra?.nome || 'Todas_Obras').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 18);
  const fileName = `RELATORIO_${prefix}_${nomeObraCurto}_${inicioLimpa}_a_${fimLimpa}.pdf`;
  doc.save(fileName);
}

export async function obterPdfPeriodoBlob(opcoes: OpcoesPdfPeriodo): Promise<{ blob: Blob; fileName: string }> {
  const doc = await gerarPdfConsolidadoPeriodo(opcoes);
  const prefix = opcoes.tipo.toUpperCase();
  const inicioLimpa = (opcoes.dataInicio || '').replace(/-/g, '');
  const fimLimpa = (opcoes.dataFim || '').replace(/-/g, '');
  const nomeObraCurto = (opcoes.obra?.nome || 'Todas_Obras').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 18);
  const fileName = `RELATORIO_${prefix}_${nomeObraCurto}_${inicioLimpa}_a_${fimLimpa}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function baixarPdfRdo(rdo: RelatorioDiarioObra, obra?: Obra): Promise<void> {
  const doc = await gerarPdfRdo(rdo, obra);
  const dataLimpa = (rdo.data || 'data').replace(/-/g, '');
  const nomeObraCurto = (obra?.nome || 'Obra').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 18);
  const fileName = `RDO_${String(rdo.numero).padStart(3, '0')}_${nomeObraCurto}_${dataLimpa}.pdf`;
  doc.save(fileName);
}

export async function obterPdfBlob(rdo: RelatorioDiarioObra, obra?: Obra): Promise<{ blob: Blob; fileName: string }> {
  const doc = await gerarPdfRdo(rdo, obra);
  const dataLimpa = (rdo.data || 'data').replace(/-/g, '');
  const nomeObraCurto = (obra?.nome || 'Obra').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 18);
  const fileName = `RDO_${String(rdo.numero).padStart(3, '0')}_${nomeObraCurto}_${dataLimpa}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function compartilharRdo(rdo: RelatorioDiarioObra, obra?: Obra): Promise<{ success: boolean; method: string }> {
  try {
    const doc = await gerarPdfRdo(rdo, obra);
    const dataLimpa = (rdo.data || 'data').replace(/-/g, '');
    const nomeObraCurto = (obra?.nome || 'Obra').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 18);
    const fileName = `RDO_${String(rdo.numero).padStart(3, '0')}_${nomeObraCurto}_${dataLimpa}.pdf`;
    
    const blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // Check if navigator.share can share files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `RDO Nº ${rdo.numero} - ${obra?.nome}`,
        text: `Segue em anexo o Relatório Diário de Obra (RDO Nº ${rdo.numero}) de ${rdo.data.split('-').reverse().join('/')} da obra ${obra?.nome}.`,
        files: [file]
      });
      return { success: true, method: 'native_share' };
    } else {
      // Fallback: trigger download and return summary text to copy
      doc.save(fileName);
      return { success: true, method: 'download_fallback' };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, method: 'cancelled' };
    }
    console.error('Erro ao compartilhar:', err);
    return { success: false, method: 'error' };
  }
}
