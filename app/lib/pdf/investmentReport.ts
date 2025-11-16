// app/lib/pdf/investmentReport.ts

// No external type imports necessary — item is treated as a dynamic object.

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
  item: any;           // must contain .property, .metrics, .score
  horizon: number;
  strategy: string;
  assumptions: PdfAssumptions;
}) {
  const { item, horizon, strategy, assumptions } = options;
  const { property, metrics, score } = item;

  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const navy = '#0C1F3F';
  const teal = '#0BB5B7';

  const marginX = 40;
  let y = 40;

  /* -----------------------------------------------------
   *  HEADER
   * ----------------------------------------------------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(navy);
  doc.text('LargeKite Capital', marginX, y);

  y += 20;
  doc.setFontSize(12);
  doc.setTextColor('#555');
  doc.setFont('helvetica', 'normal');
  doc.text('Investment Property Report', marginX, y);

  y += 8;
  doc.setFontSize(10);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} – Score: ${score}/100`,
    marginX,
    y
  );

  /* -----------------------------------------------------
   *  PROPERTY DETAILS
   * ----------------------------------------------------- */
  y += 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(navy);
  doc.text(property.address || 'Proper
