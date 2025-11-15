// app/lib/pdf/investmentReport.ts

import type { ScoredProperty } from './types'; // optional: see note below

// If you don't have a shared ScoredProperty type here, you can inline the shapes:
// type InvestmentMetrics = { ... } etc.
// or just type everything as `any` to move fast.

export interface PdfAssumptions {
  taxRate: number;
  insuranceRate: number;
  maintenanceRate: number;
  managementRate: number;
  vacancyRate: number;
  loanRate: number;
  downPayment: number;
}

export async function exportInvestmentPdf(options: {
  item: any;            // ScoredProperty
  horizon: number;
  strategy: string;
  assumptions: PdfAssumptions;
}) {
  const { item, horizon, strategy, assumptions } = options;
  const { property, metrics, score } = item;

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const marginLeft = 40;
  let cursorY = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LargeKite Capital – Investment Snapshot', marginLeft, cursorY);

  cursorY += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} • Score ${score}/100`,
    marginLeft,
    cursorY
  );

  // PROPERTY HEADER
  cursorY += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(property.address, marginLeft, cursorY);

  cursorY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    `${property.city}, ${property.state} ${property.zip}`,
    marginLeft,
    cursorY
  );

  cursorY += 16;
  doc.text(
    [
      `List price: $${property.listPrice.toLocaleString()}`,
      `Beds/Baths: ${property.beds ?? '?'} / ${property.baths ?? '?'}`,
      `Sqft: ${property.sqft?.toLocaleString() ?? '?'}`,
      `Strategy: ${strategy.replace(/_/g, ' ')} • Horizon: ${horizon} years`,
    ].join('   •   '),
    marginLeft,
    cursorY
  );

  // METRICS TABLE
  cursorY += 26;
  autoTable(doc, {
    startY: cursorY,
    head: [['Metric', 'Value']],
    body: [
      ['Estimated Rent (monthly)', `$${Math.round(metrics.estimatedRent).toLocaleString()}`],
      ['Annual NOI', `$${Math.round(metrics.annualNOI).toLocaleString()}`],
      ['Cap Rate', `${(metrics.capRate * 100).toFixed(1)} %`],
      ['Cash-on-Cash', `${(metrics.cashOnCash * 100).toFixed(1)} %`],
      ['Projected Value (horizon)', `$${Math.round(metrics.projectedValueYearN).toLocaleString()}`],
    ],
    styles: { fontSize: 10 },
    margin: { left: marginLeft, right: marginLeft },
  });

  const afterMetricsY = (doc as any).lastAutoTable.finalY || cursorY + 60;
  cursorY = afterMetricsY + 20;

  // ASSUMPTIONS TABLE
  autoTable(doc, {
    startY: cursorY,
    head: [['Assumption', 'Value']],
    body: [
      ['Tax rate', `${(assumptions.taxRate * 100).toFixed(2)} %`],
      ['Insurance rate', `${(assumptions.insuranceRate * 100).toFixed(2)} %`],
      ['Maintenance (of rent)', `${(assumptions.maintenanceRate * 100).toFixed(1)} %`],
      ['Management (of rent)', `${(assumptions.managementRate * 100).toFixed(1)} %`],
      ['Vacancy', `${(assumptions.vacancyRate * 100).toFixed(1)} %`],
      ['Loan rate', `${(assumptions.loanRate * 100).toFixed(2)} %`],
      ['Down payment', `${(assumptions.downPayment * 100).toFixed(1)} %`],
    ],
    styles: { fontSize: 10 },
    margin: { left: marginLeft, right: marginLeft },
  });

  const afterAssumptionsY = (doc as any).lastAutoTable.finalY || cursorY + 60;

  // FOOTER DISCLAIMER
  const footerY = afterAssumptionsY + 30;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'This report is for educational purposes only and does not constitute personalized investment advice.',
    marginLeft,
    footerY
  );

  const filenameSafeAddress = String(property.address || 'property')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();

  doc.save(`largekite-${filenameSafeAddress}.pdf`);
}
