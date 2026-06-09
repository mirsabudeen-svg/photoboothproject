'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AnalyticsExportProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  eventName: string;
}

export function AnalyticsExport({ targetRef, eventName }: AnalyticsExportProps) {
  const [exporting, setExporting] = useState(false);

  async function exportPDF() {
    if (!targetRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#1A1A1A',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(26, 26, 26);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.setFillColor(212, 168, 67);
      pdf.rect(0, 0, pageW, 1.5, 'F');
      pdf.setTextColor(240, 237, 232);
      pdf.setFontSize(22);
      pdf.text(eventName, 15, 18);
      pdf.setFontSize(10);
      pdf.setTextColor(138, 134, 128);
      pdf.text(
        `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        15,
        25,
      );

      const contentY = 32;
      const contentH = pageH - contentY - 10;
      const contentW = pageW - 30;
      const imgAspect = canvas.width / canvas.height;
      const renderW = Math.min(contentW, contentH * imgAspect);
      const renderH = renderW / imgAspect;
      pdf.addImage(imgData, 'JPEG', 15, contentY, renderW, renderH);

      pdf.setTextColor(90, 87, 83);
      pdf.setFontSize(8);
      pdf.text('Photobooth Platform — Confidential', 15, pageH - 6);

      pdf.save(`${eventName.replace(/\s+/g, '_')}_analytics_${Date.now()}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={exportPDF} loading={exporting}>
      <Download className="w-4 h-4" />
      Export PDF
    </Button>
  );
}
