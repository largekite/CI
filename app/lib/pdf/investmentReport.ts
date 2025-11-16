// app/lib/pdf/investmentReport.ts

export interface PdfAssumptions {
  taxRate: number;
  insuranceRate: number;
  maintenanceRate: number;
  managementRate: number;
  vacancyRate: number;
  loanRate: number;
  downPayment: number;
}

// Main export function
export async function exportInvestmentPdf(options: {
  item: any;
  horizon: number;
  strategy: string;
  assumptions: PdfAssumptions;
}) {
  const { item, horizon, strategy, assumptions } = options;
  const { property, metrics, score } = item;

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const navy = '#0C1F3F';
  const teal = '#0BB5B7';

  const marginX = 40;
  let y = 40;

  /* -------------------- HEADER -------------------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(navy);
  doc.text('LargeKite Capital', marginX, y);

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#555');
  doc.text('Investment Property Report', marginX, y);

  y += 15;
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date().toLocaleDateString()} • Score ${score}/100`,
    marginX,
    y
  );

  /* -------------------- PROPERTY DETAILS -------------------- */
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(navy);
  doc.text(property.address || 'Property', marginX, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#444');
  doc.text(
    `${property.city}, ${property.state} ${property.zip}`,
    marginX,
    y
  );

  y += 16;
  doc.text(
    [
      `Price: $${property.listPrice?.toLocaleString() ?? '-'}`,
      `${property.beds ?? '?'} bd`,
      `${property.baths ?? '?'} ba`,
      `${property.sqft?.toLocaleString?.() ?? '?'} sqft`,
      `Strategy: ${strategy.replace(/_/g, ' ')}`,
      `Horizon: ${horizon} yrs`,
    ].join(' • '),
    marginX,
    y
  );

  /* -------------------- PROPERTY PHOTO -------------------- */
  if (property.imageUrl) {
    try {
      const img = await loadImage(property.imageUrl);
      y += 20;
      doc.addImage(img, 'JPEG', marginX, y, 200, 150);
      y += 170;
    } catch (err) {
      y += 20;
      doc.setTextColor('#C00');
      doc.text('⚠ Unable to load property image', marginX, y);
      y += 10;
    }
  } else {
    y += 20;
  }

  /* -------------------- METRICS TABLE -------------------- */
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: navy, textColor: '#fff' },
    bodyStyles: { textColor: '#333' },
    margin: { left: marginX, right: marginX },
    head: [['Metric', 'Value']],
    body: [
      ['Rent (mo)', `$${Math.round(metrics.estimatedRent)}`],
      ['Annual NOI', `$${Math.round(metrics.annualNOI).toLocaleString()}`],
      ['Cap Rate', `${(metrics.capRate * 100).toFixed(1)}%`],
      ['Cash-on-Cash', `${(metrics.cashOnCash * 100).toFixed(1)}%`],
      [
        `Projected Value (Year ${horizon})`,
        `$${metrics.projectedValueYearN.toLocaleString()}`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 30;

  /* -------------------- MINI VALUE GRAPH -------------------- */
  const startPrice = property.listPrice || 0;
  const endPrice = metrics.projectedValueYearN;

  const steps = 20;
  const values: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const v = Math.round(startPrice + (endPrice - startPrice) * t);
    values.push(v);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy);
  doc.text(`Value Projection (${horizon} years)`, marginX, y);

  y += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#444');

  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const spark = values
    .map((v) => {
      const t = (v - minVal) / range;
      const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
      const idx = Math.floor(t * (blocks.length - 1));
      return blocks[idx];
    })
    .join('');

  doc.text(spark, marginX, y);

  y += 18;
  doc.text(
    `Start: $${startPrice.toLocaleString()} → End: $${endPrice.toLocaleString()}`,
    marginX,
    y
  );

  /* -------------------- ASSUMPTIONS TABLE -------------------- */
  y += 25;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: teal, textColor: '#fff' },
    margin: { left: marginX, right: marginX },
    head: [['Assumption', 'Value']],
    body: [
      ['Tax Rate', `${(assumptions.taxRate * 100).toFixed(2)}%`],
      ['Insurance', `${(assumptions.insuranceRate * 100).toFixed(2)}%`],
      ['Maintenance', `${(assumptions.maintenanceRate * 100).toFixed(1)}%`],
      ['Management', `${(assumptions.managementRate * 100).toFixed(1)}%`],
      ['Vacancy', `${(assumptions.vacancyRate * 100).toFixed(1)}%`],
      ['Loan Rate', `${(assumptions.loanRate * 100).toFixed(2)}%`],
      ['Down Payment', `${(assumptions.downPayment * 100).toFixed(1)}%`],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 40;

  /* -------------------- FOOTER -------------------- */
  doc.setFontSize(9);
  doc.setTextColor('#888');
  doc.text(
    'This report is for educational purposes only and does not constitute financial advice.',
    marginX,
    y
  );

  const safeName = (property.address || 'property')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();

  doc.save(`largekite-${safeName}.pdf`);
}

/* -------------------- IMAGE LOADER -------------------- */
async function loadImage(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
