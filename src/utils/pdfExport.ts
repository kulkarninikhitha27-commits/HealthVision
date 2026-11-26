import { jsPDF } from 'jspdf';
import { FamilyProfile, LabReport } from '../types';

export function exportHealthSummaryPdf(
  profile: FamilyProfile,
  report: LabReport,
  previousReport?: LabReport
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 48;

  const ensureSpace = (needed: number) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 48;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110);
  doc.text('HealthVision — Clinical Report Summary', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Generated ${new Date().toLocaleDateString()} · Informational Support Only (Not a Medical Diagnosis)`,
    margin,
    y
  );
  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Patient & Emergency Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient: ${profile.name} (${profile.relation}, Age ${profile.age}) · Blood Type: ${profile.bloodType}`, margin, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Allergies: ${profile.allergies.length ? profile.allergies.join(', ') : 'None recorded'} | Conditions: ${profile.conditions.length ? profile.conditions.join(', ') : 'None recorded'}`,
    margin,
    y,
    { maxWidth }
  );
  y += 15;

  if (profile.emergencyContacts.length > 0) {
    const ec = profile.emergencyContacts[0];
    doc.text(`Emergency Contact: ${ec.name} (${ec.relation}) — ${ec.phone}`, margin, y);
    y += 18;
  }

  // Report Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Report: ${report.title}`, margin, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Lab: ${report.labName} · Date: ${report.reportDate} · Category: ${report.category}`, margin, y);
  y += 18;

  // Plain-language Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Plain-Language Summary', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(report.plainSummary, maxWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 13 + 14;

  // Biomarkers Table
  ensureSpace(90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Biomarker Readings & Reference Comparison', margin, y);
  y += 14;

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Test Parameter', margin, y);
  doc.text('Result', margin + 185, y);
  doc.text('Reference', margin + 275, y);
  doc.text('Status', margin + 365, y);
  doc.text('vs. Prior', margin + 435, y);
  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 13;

  for (const m of report.metrics) {
    ensureSpace(24);
    const prev = previousReport?.metrics.find((pm) => pm.key === m.key);
    const delta = prev ? +(m.value - prev.value).toFixed(2) : null;
    const deltaLabel = delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta} ${m.unit}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(m.name.slice(0, 32), margin, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`${m.value} ${m.unit}`, margin + 185, y);
    doc.setTextColor(100, 116, 139);
    doc.text(`${m.refMin}–${m.refMax}`, margin + 275, y);

    if (m.status === 'normal') {
      doc.setTextColor(22, 163, 74);
    } else if (m.status === 'borderline') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(m.status.toUpperCase(), margin + 365, y);
    doc.setTextColor(71, 85, 105);
    doc.text(deltaLabel, margin + 435, y);
    y += 16;
  }

  // Risk Signals
  if (report.riskSignals.length > 0) {
    y += 10;
    ensureSpace(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Informational Health Risk Signals', margin, y);
    y += 14;

    for (const r of report.riskSignals) {
      ensureSpace(45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${r.domain} (${r.level} Attention)`, margin, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const rLines = doc.splitTextToSize(r.summary, maxWidth);
      doc.text(rLines, margin, y);
      y += rLines.length * 12 + 8;
    }
  }

  // Disclaimer Footer
  ensureSpace(48);
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const disclaimer = doc.splitTextToSize(
    'Disclaimer: HealthVision provides AI-assisted educational and informational explanations of laboratory values. This summary is not a medical diagnosis and should not replace advice from a qualified healthcare professional.',
    maxWidth
  );
  doc.text(disclaimer, margin, y);

  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`healthvision-summary-${safeName}-${report.reportDate}.pdf`);
}
