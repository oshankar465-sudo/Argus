import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Candidate, Task } from '../types';
import { formatDate, formatTimestamp } from './formatters';

interface SystemStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  startedTasks: number;
  overallCompletionRate: number;
  totalCandidates: number;
  technicalCandidates: number;
  nonTechnicalCandidates: number;
}

// Colors for professional report
const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // Slate 900
const SECONDARY_COLOR: [number, number, number] = [71, 85, 105]; // Slate 600
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // Slate 200
const ACCENT_COLOR: [number, number, number] = [30, 41, 59]; // Slate 800
const BG_LIGHT: [number, number, number] = [248, 250, 252]; // Slate 50

export function generateOverallReport(
  candidates: Candidate[],
  allTasks: Array<Task & { candidateName: string; candidateType: string }>,
  stats: SystemStats
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generationDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // PAGE 1: COVER & EXECUTIVE SUMMARY
  let currentY = margin;

  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARGUS', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Assignment & Resource Guidance Utility System', margin + 6, currentY + 16);

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generationDate}`, pageWidth - margin - 6, currentY + 13, { align: 'right' });

  currentY += 30;

  // Report Title
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Overall Candidate Task Report', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...SECONDARY_COLOR);
  currentY += 6;
  doc.text('Executive snapshot of candidate progression, assignment statuses, and resource allocations.', margin, currentY);

  currentY += 12;

  // SECTION 1: TASK OVERVIEW BOX
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Task Overview', margin, currentY);

  currentY += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  // Task metrics inside box
  const colW = contentWidth / 5;
  const metrics = [
    { label: 'Total Tasks', value: stats.totalTasks.toString(), color: PRIMARY_COLOR },
    { label: 'Completed', value: stats.completedTasks.toString(), color: [16, 185, 129] as [number, number, number] },
    { label: 'In Progress', value: stats.inProgressTasks.toString(), color: [245, 158, 11] as [number, number, number] },
    { label: 'Not Started', value: stats.notStartedTasks.toString(), color: SECONDARY_COLOR },
    { label: 'Started', value: stats.startedTasks.toString(), color: [14, 165, 233] as [number, number, number] },
  ];

  metrics.forEach((m, idx) => {
    const xPos = margin + idx * colW + colW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, xPos, currentY + 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, xPos, currentY + 22, { align: 'center' });
  });

  // Overall Completion Rate Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Overall Task Completion Rate: ${stats.overallCompletionRate}%`, margin + 6, currentY + 30);

  currentY += 42;

  // SECTION 2: CANDIDATE OVERVIEW BOX
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Candidate Overview', margin, currentY);

  currentY += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  const cColW = contentWidth / 3;
  const cMetrics = [
    { label: 'Total Candidates', value: stats.totalCandidates.toString() },
    { label: 'Technical Candidates', value: stats.technicalCandidates.toString() },
    { label: 'Non-Technical Candidates', value: stats.nonTechnicalCandidates.toString() },
  ];

  cMetrics.forEach((cm, idx) => {
    const xPos = margin + idx * cColW + cColW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(cm.value, xPos, currentY + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(cm.label, xPos, currentY + 18, { align: 'center' });
  });

  currentY += 32;

  // GLOBAL TASK TABLE on page 1 or continuing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Global Task Registry', margin, currentY);

  currentY += 4;

  const sortedTasks = [...allTasks].sort((a, b) => {
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return a.endDate.localeCompare(b.endDate);
  });

  const taskTableRows = sortedTasks.map((t) => {
    const totalSubs = t.subtasks.length;
    const completedSubs = t.subtasks.filter((s) => s.status === 'Completed').length;
    const progressText = totalSubs > 0 ? `${completedSubs}/${totalSubs}` : '—';
    const resCount = t.resources.length;

    return [
      t.name,
      t.candidateName,
      t.candidateType,
      t.status,
      formatDate(t.endDate),
      progressText,
      resCount > 0 ? `${resCount} file(s)` : '—',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Task', 'Candidate', 'Type', 'Status', 'End Date', 'Subtasks', 'Resources']],
    body: taskTableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: ACCENT_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: () => {
      // Running header and footer handled at end
    },
  });

  // CANDIDATE DETAILS SECTION
  // Start candidate profiles on fresh page
  doc.addPage();
  currentY = margin + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Candidate Detailed Records', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SECONDARY_COLOR);
  currentY += 5;
  doc.text('Comprehensive profile workspaces, nested tasks, subtask statuses, attached resources, and chronological audit trails.', margin, currentY);

  currentY += 8;

  candidates.forEach((cand, candIdx) => {
    // Check if enough space remains on page; if not, add page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin + 8;
    }

    // Candidate Header Banner
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    doc.line(margin, currentY + 12, margin + contentWidth, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`${candIdx + 1}. ${cand.name}`, margin + 4, currentY + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    const typeLabel = `[${cand.type.toUpperCase()}]`;
    doc.text(typeLabel, margin + 50, currentY + 7.5);

    if (cand.email) {
      doc.text(cand.email, margin + 85, currentY + 7.5);
    }

    // Candidate stats calculation
    const totalT = cand.tasks.length;
    const compT = cand.tasks.filter((t) => t.status === 'Completed').length;
    const inProgT = cand.tasks.filter((t) => t.status === 'In Progress').length;
    const notStartT = cand.tasks.filter((t) => t.status === 'No Status').length;
    const startT = cand.tasks.filter((t) => t.status === 'Started').length;
    const progPct = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`${progPct}% Progress`, pageWidth - margin - 4, currentY + 7.5, { align: 'right' });

    currentY += 16;

    // Summary line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    const summaryLine = `Tasks: ${totalT} total | ${compT} Completed | ${inProgT} In Progress | ${startT} Started | ${notStartT} Not Started`;
    doc.text(summaryLine, margin + 4, currentY);
    currentY += 4;

    if (cand.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Notes: "${cand.notes}"`, margin + 4, currentY);
      currentY += 5;
    }

    // Tasks breakdown
    if (cand.tasks.length > 0) {
      const candTaskRows: string[][] = [];

      cand.tasks.forEach((t) => {
        const subList = t.subtasks.map((s) => `• ${s.name} [${s.status}]`).join('\n');
        const resList = t.resources.map((r) => `📎 ${r.name}`).join('\n');
        candTaskRows.push([
          t.name,
          t.status,
          formatDate(t.endDate),
          t.description || '—',
          subList || 'None',
          resList || 'None',
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Task', 'Status', 'End Date', 'Description', 'Subtasks', 'Resources']],
        body: candTaskRows,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 18 },
          2: { cellWidth: 16 },
          3: { cellWidth: 38 },
          4: { cellWidth: 46 },
          5: { cellWidth: 36 },
        },
      });

      // Update currentY after table
      currentY = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text('No tasks recorded for this candidate.', margin + 4, currentY);
      currentY += 6;
    }

    // Candidate-Level Resources
    if (cand.resources.length > 0) {
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = margin + 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text('Candidate Resources:', margin + 4, currentY);
      currentY += 4;

      cand.resources.forEach((r) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...SECONDARY_COLOR);
        const detail = r.type === 'link' ? `(Link: ${r.url})` : `(${r.fileSize || 'File'})`;
        doc.text(`• ${r.name} ${detail}`, margin + 8, currentY);
        currentY += 4;
      });
      currentY += 2;
    }

    // Candidate Activity History (recent top 6)
    if (cand.history.length > 0) {
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = margin + 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text('Activity History Log:', margin + 4, currentY);
      currentY += 4;

      const displayHistory = cand.history.slice(0, 8);
      displayHistory.forEach((h) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${formatTimestamp(h.timestamp)}: ${h.action}`, margin + 8, currentY);
        currentY += 3.5;
      });
    }

    currentY += 8;
  });

  // Running Header & Footer with Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header on pages > 1
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text('ARGUS — Overall Candidate Task Report', margin, 9);
      doc.text(generationDate, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(...BORDER_COLOR);
      doc.line(margin, 11, pageWidth - margin, 11);
    }

    // Footer on all pages
    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('Confidential — Internal System Report', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // Save the PDF
  doc.save(`ARGUS_Overall_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateCandidateDossierReport(candidate: Candidate) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generationDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let currentY = margin;

  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, currentY, contentWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARGUS', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Individual Candidate Dossier', margin + 6, currentY + 15);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generationDate}`, pageWidth - margin - 6, currentY + 12, { align: 'right' });

  currentY += 28;

  // Candidate Name & Badge
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(candidate.name, margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY_COLOR);
  currentY += 6;
  const subInfo = [
    `Type: ${candidate.type}`,
    candidate.email ? `Email: ${candidate.email}` : '',
  ].filter(Boolean).join('  |  ');
  doc.text(subInfo, margin, currentY);

  currentY += 10;

  // Stats Box
  const totalTasks = candidate.tasks.length;
  const completedTasks = candidate.tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = candidate.tasks.filter((t) => t.status === 'In Progress').length;
  const startedTasks = candidate.tasks.filter((t) => t.status === 'Started').length;
  const notStartedTasks = candidate.tasks.filter((t) => t.status === 'No Status').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  const cColW = contentWidth / 6;
  const metrics = [
    { label: 'Total Tasks', value: totalTasks.toString() },
    { label: 'Completed', value: completedTasks.toString() },
    { label: 'In Progress', value: inProgressTasks.toString() },
    { label: 'Started', value: startedTasks.toString() },
    { label: 'Not Started', value: notStartedTasks.toString() },
    { label: 'Completion', value: `${progressPct}%` },
  ];

  metrics.forEach((m, idx) => {
    const xPos = margin + idx * cColW + cColW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, xPos, currentY + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, xPos, currentY + 18, { align: 'center' });
  });

  currentY += 32;

  if (candidate.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Candidate Notes:', margin, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    const splitNotes = doc.splitTextToSize(candidate.notes, contentWidth);
    doc.text(splitNotes, margin, currentY);
    currentY += splitNotes.length * 4.5 + 4;
  }

  // Tasks & Subtasks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Tasks & Subtasks', margin, currentY);
  currentY += 4;

  const taskRows: string[][] = [];
  candidate.tasks.forEach((t) => {
    const subs = t.subtasks.map((s) => `• ${s.name} [${s.status}]`).join('\n');
    const res = t.resources.map((r) => `📎 ${r.name}`).join('\n');
    taskRows.push([
      t.name,
      t.status,
      formatDate(t.endDate),
      t.description || '—',
      subs || 'None',
      res || 'None',
    ]);
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Task', 'Status', 'End Date', 'Description', 'Subtasks', 'Resources']],
    body: taskRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: ACCENT_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Candidate Resources
  if (candidate.resources.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Candidate-Level Resources', margin, currentY);
    currentY += 4;

    const resRows = candidate.resources.map((r) => [
      r.name,
      r.type.toUpperCase(),
      r.type === 'link' ? (r.url || '—') : (r.fileName || '—'),
      r.fileSize || '—',
      formatDate(r.createdAt),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Resource Name', 'Type', 'Target / File', 'Size', 'Added Date']],
      body: resRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Complete Activity Log
  if (candidate.history.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Complete Activity Audit Log', margin, currentY);
    currentY += 4;

    const histRows = candidate.history.map((h) => [
      formatTimestamp(h.timestamp),
      h.action,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Timestamp', 'Action / Event Recorded']],
      body: histRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 45 },
      },
    });
  }

  // Headers and Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text(`ARGUS — Candidate Dossier: ${candidate.name}`, margin, 9);
      doc.text(generationDate, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(...BORDER_COLOR);
      doc.line(margin, 11, pageWidth - margin, 11);
    }

    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('ARGUS Candidate Record — Confidential', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  const safeCandName = candidate.name.replace(/\s+/g, '_');
  doc.save(`ARGUS_Candidate_${safeCandName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateAuditTaskReport(
  candidates: Candidate[],
  allTasks: Array<Task & { candidateName: string; candidateType: string }>,
  stats: SystemStats
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const auditDocId = `AUDIT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const generationDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Collect all independent subtasks
  const allSubtasks = allTasks.flatMap((t) =>
    t.subtasks.map((s) => ({
      ...s,
      taskName: t.name,
      candidateName: t.candidateName,
    }))
  );

  const subCompleted = allSubtasks.filter((s) => s.status === 'Completed').length;
  const subInProgress = allSubtasks.filter((s) => s.status === 'In Progress').length;
  const subStarted = allSubtasks.filter((s) => s.status === 'Started').length;
  const subNoStatus = allSubtasks.filter((s) => s.status === 'No Status').length;
  const collaborativeTasks = allTasks.filter((t) => t.isCollaborative);

  // Collect all audit history logs
  const seenLogIds = new Set<string>();
  const auditLogs: Array<{
    timestamp: string;
    action: string;
    target: string;
    candidateName: string;
    type: string;
  }> = [];

  allTasks.forEach((t) => {
    t.history.forEach((h) => {
      if (!seenLogIds.has(h.id)) {
        seenLogIds.add(h.id);
        auditLogs.push({
          timestamp: h.timestamp,
          action: h.action,
          target: `Task: ${t.name}`,
          candidateName: t.candidateName,
          type: h.type,
        });
      }
    });

    t.subtasks.forEach((s) => {
      s.history.forEach((h) => {
        if (!seenLogIds.has(h.id)) {
          seenLogIds.add(h.id);
          auditLogs.push({
            timestamp: h.timestamp,
            action: h.action,
            target: `Subtask: ${s.name} (${t.name})`,
            candidateName: t.candidateName,
            type: h.type,
          });
        }
      });
    });
  });

  auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // PAGE 1: AUDIT COVER & SUMMARY
  let currentY = margin;

  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARGUS', margin + 6, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Assignment & Resource Guidance Utility System', margin + 6, currentY + 18);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Audit Ref: ${auditDocId}`, pageWidth - margin - 6, currentY + 10, { align: 'right' });
  doc.text(`Generated: ${generationDate}`, pageWidth - margin - 6, currentY + 17, { align: 'right' });

  currentY += 32;

  // Audit Title
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Task & Subtask Audit Report', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY_COLOR);
  currentY += 6;
  doc.text(
    'Comprehensive audit report of task lifecycles, independent subtask statuses, collaborative assignees, and event logs.',
    margin,
    currentY
  );

  currentY += 12;

  // Audit Metrics Summary Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Audit Overview & Metrics', margin, currentY);

  currentY += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const auditMetrics = [
    { label: 'Total Tasks Audited', value: allTasks.length.toString(), sub: `${stats.completedTasks} completed` },
    { label: 'Independent Subtasks', value: allSubtasks.length.toString(), sub: `${subCompleted} completed, ${subInProgress} in progress` },
    { label: 'Collaborative Tasks', value: collaborativeTasks.length.toString(), sub: `${collaborativeTasks.length > 0 ? 'Multi-assignee' : 'None'}` },
    { label: 'Audit Log Entries', value: auditLogs.length.toString(), sub: 'Recorded events' },
  ];

  auditMetrics.forEach((m, idx) => {
    const x = margin + idx * colWidth + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x, currentY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x, currentY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.sub, x, currentY + 28);
  });

  currentY += 46;

  // Subtask Status Distribution Strip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Independent Subtask Status Distribution', margin, currentY);

  currentY += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'FD');

  const subColWidth = contentWidth / 4;
  const subStatuses = [
    { label: 'Completed Subtasks', count: subCompleted, color: [16, 185, 129] as [number, number, number] },
    { label: 'In Progress Subtasks', count: subInProgress, color: [245, 158, 11] as [number, number, number] },
    { label: 'Started Subtasks', count: subStarted, color: [14, 165, 233] as [number, number, number] },
    { label: 'No Status Subtasks', count: subNoStatus, color: [113, 113, 122] as [number, number, number] },
  ];

  subStatuses.forEach((st, idx) => {
    const x = margin + idx * subColWidth + 4;
    doc.setFillColor(...st.color);
    doc.circle(x + 2, currentY + 8, 1.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(st.count.toString(), x + 7, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(st.label, x + 16, currentY + 9.5);
  });

  currentY += 24;

  // SECTION 1: TASK AUDIT TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Section 1: Task Assignment & Subtask Status Audit Matrix', margin, currentY);

  currentY += 3;

  const taskTableData = allTasks.map((t) => {
    let assigneeText = t.candidateName;
    if (t.isCollaborative && t.collaboratorIds && t.collaboratorIds.length > 0) {
      const collabs = candidates
        .filter((c) => t.collaboratorIds?.includes(c.id))
        .map((c) => c.name);
      assigneeText = `[Collab] ${collabs.join(', ')}`;
    }

    // Format subtasks with individual independent statuses
    const subtaskStatusList = t.subtasks.length > 0
      ? t.subtasks.map((s) => `• [${s.status}] ${s.name}`).join('\n')
      : 'None';

    const resList = t.resources.length > 0
      ? t.resources.map((r) => `• ${r.name} (${r.type})`).join('\n')
      : 'None';

    return [
      t.name,
      assigneeText,
      t.status,
      t.endDate ? formatDate(t.endDate) : 'Not specified',
      subtaskStatusList,
      resList,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Task Name', 'Assignee / Collaborators', 'Status', 'Target Date', 'Independent Subtasks', 'Resources']],
    body: taskTableData,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 34 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 46 },
      5: { cellWidth: 30 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // SECTION 2: SUBTASK INDEPENDENT STATUS INVENTORY
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Section 2: Independent Subtask Status Inventory', margin, currentY);

  currentY += 3;

  if (allSubtasks.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('No subtasks recorded across current tasks.', margin, currentY + 5);
    currentY += 12;
  } else {
    const subtaskTableData = allSubtasks.map((s) => [
      s.name,
      s.taskName,
      s.candidateName,
      s.status,
      s.resources.length > 0 ? `${s.resources.length} attached` : 'None',
      s.createdAt ? formatDate(s.createdAt) : '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Subtask Name', 'Parent Task', 'Assignee', 'Independent Status', 'Resources', 'Created Date']],
      body: subtaskTableData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 38 },
        2: { cellWidth: 32 },
        3: { cellWidth: 26 },
        4: { cellWidth: 24 },
        5: { cellWidth: 22 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // SECTION 3: CHRONOLOGICAL AUDIT TRAIL LOGS
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Section 3: Chronological Audit Trail & Activity Event Logs', margin, currentY);

  currentY += 3;

  if (auditLogs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('No event history recorded.', margin, currentY + 5);
  } else {
    const auditTableData = auditLogs.slice(0, 100).map((log) => [
      formatTimestamp(log.timestamp),
      log.action,
      log.target,
      log.candidateName,
      log.type.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Timestamp', 'Action / Event Description', 'Target Entity', 'Candidate / Assignee', 'Category']],
      body: auditTableData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 6.8,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 62 },
        2: { cellWidth: 46 },
        3: { cellWidth: 28 },
        4: { cellWidth: 18 },
      },
    });
  }

  // Page Numbers and Running Headers/Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text(`ARGUS — Task & Subtask Audit Report [${auditDocId}]`, margin, 9);
      doc.text(generationDate, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(...BORDER_COLOR);
      doc.line(margin, 11, pageWidth - margin, 11);
    }

    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('ARGUS Audit Trail & Compliance Verification — Confidential', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  doc.save(`ARGUS_Task_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateSingleTaskReport(task: Task, candidates: Candidate[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generationDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const taskDocId = `TSK-${task.id.slice(-6).toUpperCase()}`;

  // Find assigned candidate(s)
  const assignedCandidate = candidates.find((c) => c.id === task.candidateId);
  const collaboratorCandidates =
    task.isCollaborative && task.collaboratorIds && task.collaboratorIds.length > 0
      ? candidates.filter((c) => task.collaboratorIds?.includes(c.id))
      : assignedCandidate
      ? [assignedCandidate]
      : [];

  let currentY = margin;

  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARGUS', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Individual Task & Candidate Assignment Dossier', margin + 6, currentY + 16);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Report ID: ${taskDocId} | Generated: ${generationDate}`, pageWidth - margin - 6, currentY + 13, {
    align: 'right',
  });

  currentY += 30;

  // Task Name & Subtitle
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(task.name, margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY_COLOR);
  currentY += 6;
  doc.text(
    task.description || 'Comprehensive task assignment dossier, candidate details, independent subtask statuses, and audit history.',
    margin,
    currentY,
    { maxWidth: contentWidth }
  );

  currentY += 14;

  // Task Overview Metrics Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Task Specifications & Status', margin, currentY);

  currentY += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const taskMetrics = [
    { label: 'Task Status', value: task.status },
    { label: 'Target Due Date', value: task.endDate ? formatDate(task.endDate) : 'No due date set' },
    {
      label: 'Assignment Scope',
      value: task.isCollaborative ? `Collaborative (${collaboratorCandidates.length})` : 'Individual Task',
    },
    {
      label: 'Subtasks Logged',
      value: `${task.subtasks.length} total (${task.subtasks.filter((s) => s.status === 'Completed').length} done)`,
    },
  ];

  taskMetrics.forEach((m, idx) => {
    const x = margin + idx * colWidth + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x, currentY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x, currentY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
  });

  currentY += 40;

  // SECTION 1: ASSIGNED CANDIDATES ROSTER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Section 1: Assigned Candidates & Collaborators', margin, currentY);

  currentY += 3;

  const candidateTableData = collaboratorCandidates.map((c, idx) => {
    const isPrimary = c.id === task.candidateId;
    const completedCount = c.tasks.filter((t) => t.status === 'Completed').length;
    return [
      c.name + (isPrimary ? ' (Lead / Primary)' : ' (Collaborator)'),
      c.type,
      c.email || 'None provided',
      c.notes || 'No background notes',
      `${completedCount}/${c.tasks.length} tasks completed`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Candidate Name', 'Type / Track', 'Email Address', 'Candidate Notes', 'Candidate Overall Progress']],
    body: candidateTableData,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // SECTION 2: INDEPENDENT SUBTASKS BREAKDOWN
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Section 2: Independent Subtasks Breakdown & Progress', margin, currentY);

  currentY += 3;

  if (task.subtasks.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('No subtasks currently assigned to this task.', margin, currentY + 5);
    currentY += 12;
  } else {
    const subtaskTableData = task.subtasks.map((s) => [
      s.name,
      s.status,
      s.description || 'None',
      s.resources.length > 0 ? `${s.resources.length} resources attached` : 'No attachments',
      s.createdAt ? formatDate(s.createdAt) : '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Subtask Name', 'Independent Status', 'Description / Instructions', 'Resources', 'Created Date']],
      body: subtaskTableData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 46 },
        1: { cellWidth: 30 },
        2: { cellWidth: 52 },
        3: { cellWidth: 28 },
        4: { cellWidth: 26 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // SECTION 3: TASK & SUBTASK RESOURCES
  const allTaskResources = [
    ...task.resources.map((r) => ({ ...r, origin: 'Task Level' })),
    ...task.subtasks.flatMap((s) => s.resources.map((r) => ({ ...r, origin: `Subtask: ${s.name}` }))),
  ];

  if (allTaskResources.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Section 3: Attached Resources & Documentation', margin, currentY);

    currentY += 3;

    const resourceTableData = allTaskResources.map((r) => [
      r.name,
      r.type.toUpperCase(),
      r.origin,
      r.url || r.fileName || 'Embedded file',
      r.createdAt ? formatDate(r.createdAt) : '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Resource Name', 'Format Type', 'Attachment Scope', 'Link / Filename', 'Date Added']],
      body: resourceTableData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: 24 },
        2: { cellWidth: 38 },
        3: { cellWidth: 50 },
        4: { cellWidth: 26 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // SECTION 4: CHRONOLOGICAL AUDIT & EVENT LOG
  const taskLogs: Array<{
    timestamp: string;
    action: string;
    target: string;
    type?: string;
  }> = [
    ...(task.history || []).map((h) => ({
      timestamp: h.timestamp,
      action: h.action,
      target: `Task: ${task.name}`,
      type: h.type || 'task',
    })),
    ...task.subtasks.flatMap((s) =>
      (s.history || []).map((h) => ({
        timestamp: h.timestamp,
        action: h.action,
        target: `Subtask: ${s.name}`,
        type: h.type || 'subtask',
      }))
    ),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (taskLogs.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Section 4: Chronological Audit Trail & Status History', margin, currentY);

    currentY += 3;

    const logTableData = taskLogs.slice(0, 40).map((l) => [
      formatTimestamp(l.timestamp),
      l.action,
      l.target,
      (l.type || 'TASK').toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Timestamp', 'Audit Event Action', 'Target Context', 'Category']],
      body: logTableData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 78 },
        2: { cellWidth: 46 },
        3: { cellWidth: 24 },
      },
    });
  }

  // Page Numbers & Running Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text(`ARGUS — Task Report: ${task.name} [${taskDocId}]`, margin, 9);
      doc.text(generationDate, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(...BORDER_COLOR);
      doc.line(margin, 11, pageWidth - margin, 11);
    }

    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('ARGUS Candidate & Task System — Task Dossier', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  const cleanFileName = task.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  doc.save(`ARGUS_Task_${cleanFileName}_Report.pdf`);
}
