import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SanctionOrder } from '../types/sanction';
import {
  computeOrderTotals,
  formatDashDate,
  formatIndianNumber,
  formatRsSlash,
  formatSlashDate,
  getDisplayOrderDate,
  getResolvedPayeeText,
} from './indianFormat';
import {
  DEFAULT_FONT_SIZE_PT,
  resolveFontOption,
  resolveFontSizePt,
  resolvePageMargins,
} from './documentStyle';

interface TextSegment {
  text: string;
  bold: boolean;
  isRupeeSymbol?: boolean;
}

interface WordToken {
  text: string;
  bold: boolean;
  width: number;
  isRupeeSymbol?: boolean;
}

/**
 * Draws a razor-sharp vector Indian Rupee symbol (₹) directly onto the PDF canvas
 * at the given baseline (x, y) so exported PDFs never suffer from WinAnsi encoding bugs.
 */
function drawVectorRupee(doc: jsPDF, x: number, baselineY: number, fontSizePt: number): void {
  const h = fontSizePt * 0.352778 * 0.72;
  const w = h * 0.62;
  const topY = baselineY - h;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(Math.max(0.18, fontSizePt * 0.022));

  doc.line(x, topY + h * 0.06, x + w, topY + h * 0.06);
  doc.line(x, topY + h * 0.33, x + w, topY + h * 0.33);

  const loopMidX = x + w * 0.68;
  const loopBotY = topY + h * 0.56;
  doc.lines(
    [
      [w * 0.38, 0, w * 0.52, h * 0.14, w * 0.52, h * 0.27],
      [0, h * 0.14, -w * 0.16, h * 0.23, -w * 0.52, h * 0.23],
    ],
    x + w * 0.14,
    topY + h * 0.06
  );

  doc.line(x + w * 0.1, loopBotY, x + loopMidX, baselineY);
}

/**
 * Renders mixed bold/regular rich-text segments with clean word wrapping and optional
 * first-line indent + full justification.
 */
function renderRichParagraph(
  doc: jsPDF,
  segments: TextSegment[],
  x: number,
  startY: number,
  maxWidth: number,
  fontName: string,
  fontSize: number,
  lineHeightMm: number,
  firstLineIndentMm = 0,
  justify = true
): number {
  doc.setFontSize(fontSize);

  const tokens: WordToken[] = [];
  for (const seg of segments) {
    if (seg.isRupeeSymbol) {
      tokens.push({
        text: '₹',
        bold: seg.bold,
        width: fontSize * 0.352778 * 0.62,
        isRupeeSymbol: true,
      });
      continue;
    }
    const parts = seg.text.split(/(\s+)/);
    doc.setFont(fontName, seg.bold ? 'bold' : 'normal');
    for (const part of parts) {
      if (!part) continue;
      tokens.push({
        text: part,
        bold: seg.bold,
        width: doc.getTextWidth(part),
      });
    }
  }

  const lines: WordToken[][] = [];
  let currentLine: WordToken[] = [];
  let currentWidth = firstLineIndentMm;

  for (const tok of tokens) {
    const isSpace = /^\s+$/.test(tok.text);
    if (isSpace && currentLine.length === 0) {
      continue;
    }
    if (!isSpace && currentLine.length > 0 && currentWidth + tok.width > maxWidth) {
      while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
        currentLine.pop();
      }
      lines.push(currentLine);
      currentLine = [tok];
      currentWidth = tok.width;
    } else {
      currentLine.push(tok);
      currentWidth += tok.width;
    }
  }
  if (currentLine.length > 0) {
    while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
      currentLine.pop();
    }
    if (currentLine.length > 0) lines.push(currentLine);
  }

  let y = startY;
  lines.forEach((line, lineIdx) => {
    const isFirst = lineIdx === 0;
    const isLast = lineIdx === lines.length - 1;
    const indent = isFirst ? firstLineIndentMm : 0;

    const spaceIndices: number[] = [];
    let naturalWidth = indent;
    line.forEach((t, idx) => {
      naturalWidth += t.width;
      if (/^\s+$/.test(t.text) && t.text.length === 1) {
        spaceIndices.push(idx);
      }
    });

    const extraSpacePerGap =
      justify && !isLast && spaceIndices.length > 0
        ? Math.min(2.2, Math.max(0, (maxWidth - naturalWidth) / spaceIndices.length))
        : 0;

    let cursorX = x + indent;
    line.forEach((t, idx) => {
      doc.setFont(fontName, t.bold ? 'bold' : 'normal');
      if (t.isRupeeSymbol) {
        drawVectorRupee(doc, cursorX, y, fontSize);
      } else if (!/^\s+$/.test(t.text)) {
        doc.text(t.text, cursorX, y);
      }
      cursorX += t.width + (spaceIndices.includes(idx) ? extraSpacePerGap : 0);
    });

    y += lineHeightMm;
  });

  return y;
}

/**
 * Helper to render a right-aligned or centered currency value with vector ₹ symbol.
 */
function drawRupeeText(
  doc: jsPDF,
  amount: number,
  anchorX: number,
  baselineY: number,
  fontName: string,
  fontSize: number,
  bold: boolean,
  align: 'right' | 'center',
  showDecimals: boolean
): void {
  const numStr = formatIndianNumber(amount, showDecimals);
  doc.setFont(fontName, bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const numWidth = doc.getTextWidth(numStr);
  const rupeeGap = 3.2;

  if (align === 'right') {
    doc.text(numStr, anchorX, baselineY, { align: 'right' });
    drawVectorRupee(doc, anchorX - numWidth - rupeeGap, baselineY, fontSize);
  } else {
    const totalW = rupeeGap + numWidth;
    const startX = anchorX - totalW / 2;
    drawVectorRupee(doc, startX, baselineY, fontSize);
    doc.text(numStr, startX + rupeeGap, baselineY);
  }
}

export function exportSanctionOrderPdf(order: SanctionOrder): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  const margins = resolvePageMargins(order);
  const marginLeft = margins.left;
  const marginRight = margins.right;
  const marginTop = margins.top;
  const marginBottom = margins.bottom;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const fontName = resolveFontOption(order.fontFamily).pdfFont;
  const fontScale = resolveFontSizePt(order) / DEFAULT_FONT_SIZE_PT;
  const pt = (basePt: number) => Number((basePt * fontScale).toFixed(2));
  const mm = (baseMm: number) => Number((baseMm * fontScale).toFixed(2));
  const totals = computeOrderTotals(order);
  const layoutStyle = order.layoutStyle ?? 'vendor-table';
  const showDecimals = Boolean(order.showDecimals);
  const isBoldOrderTitle = order.orderTitleStyle === 'bold';
  const isRefBold = order.openingRefBold !== false;
  const connector = (order.openingClauseConnector || 'on account of').trim();

  let y = marginTop;

  // --- DEDICATED LAYOUT: Bank Forwarding Letter (Cheque & Annexure-I) ---
  if (layoutStyle === 'bank-letter') {
    const bl = order.bankLetter ?? {
      showLetterhead: false,
      recipientLine1: 'To',
      recipientLine2: 'Chief Manager',
      recipientLine3: 'State Bank of India',
      recipientLine4: 'MU Campus',
      salutation: 'Sir/Madam,',
      bodyPrefix: 'Enclose herewith is Cheque no.',
      chequeNo: '',
      chequeDateIso: order.orderDateIso,
      chequeAmount: 0,
      bodySuffix: 'only for crediting to the individual accounts listed on Annexure-I.',
      leftSignatoryTitle: 'Registrar',
      leftSignatoryOrg: order.institutionName || 'Manipur University',
      rightSignatoryTitle: 'Finance Officer',
      rightSignatoryOrg: order.institutionName || 'Manipur University',
    };

    const letterFontSize = pt(11.2);
    const letterLineHeight = mm(6.4);
    doc.setTextColor(0, 0, 0);

    if (bl.showLetterhead) {
      if (order.logoDataUrl) {
        try {
          const imgSize = 17;
          const format = order.logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(
            order.logoDataUrl,
            format,
            (pageWidth - imgSize) / 2,
            y,
            imgSize,
            imgSize,
            undefined,
            'FAST'
          );
          y += imgSize + 4;
        } catch {
          // Ignore malformed data URL gracefully
        }
      }
      doc.setFont(fontName, 'bold');
      doc.setFontSize(pt(13.5));
      doc.text(order.institutionName.trim() || 'INSTITUTION NAME', pageWidth / 2, y, {
        align: 'center',
      });
      y += mm(6);
      if (order.institutionLocation.trim()) {
        doc.setFont(fontName, 'bold');
        doc.setFontSize(pt(11.5));
        doc.text(order.institutionLocation.trim(), pageWidth / 2, y, { align: 'center' });
        y += mm(5);
      }
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;
    } else {
      y += 6;
    }

    // Recipient block
    doc.setFont(fontName, 'normal');
    doc.setFontSize(letterFontSize);
    [bl.recipientLine1, bl.recipientLine2, bl.recipientLine3, bl.recipientLine4]
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        doc.text(line, marginLeft, y);
        y += mm(6.2);
      });

    y += 10;

    // Salutation
    if (bl.salutation.trim()) {
      doc.text(bl.salutation.trim(), marginLeft, y);
      y += mm(8.5);
    }

    // Body paragraph
    const isBoldFigure = order.boldAmountInFigure ?? true;
    const isBoldWords = order.boldAmountInWords ?? true;
    const chequeDateDisplay = formatSlashDate(bl.chequeDateIso);

    const bankBodySegments: TextSegment[] = [
      { text: `${bl.bodyPrefix.trim()}        `, bold: false },
      { text: bl.chequeNo.trim() || '______', bold: true },
      { text: '            ', bold: false },
      { text: `Dated ${chequeDateDisplay}`, bold: true },
      { text: ' for ', bold: false },
      { text: '₹', bold: isBoldFigure, isRupeeSymbol: true },
      { text: ` ${formatIndianNumber(bl.chequeAmount, showDecimals)}`, bold: isBoldFigure },
      { text: ' ', bold: false },
      { text: `(${totals.grossInWords})`, bold: isBoldWords },
      { text: ` ${bl.bodySuffix.trim()}`, bold: false },
    ];

    y = renderRichParagraph(
      doc,
      bankBodySegments,
      marginLeft,
      y,
      contentWidth,
      fontName,
      letterFontSize,
      letterLineHeight,
      15,
      true
    );

    // Joint signatories
    y += 42;
    const leftSigX = marginLeft + 16;
    const rightSigX = pageWidth - marginRight - 54;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(letterFontSize);
    if (bl.leftSignatoryTitle.trim()) {
      doc.text(bl.leftSignatoryTitle.trim(), leftSigX, y);
    }
    if (bl.rightSignatoryTitle.trim()) {
      doc.text(bl.rightSignatoryTitle.trim(), rightSigX, y);
    }
    y += mm(6.4);
    if (bl.leftSignatoryOrg.trim()) {
      doc.text(bl.leftSignatoryOrg.trim(), leftSigX, y);
    }
    if (bl.rightSignatoryOrg.trim()) {
      doc.text(bl.rightSignatoryOrg.trim(), rightSigX, y);
    }

    const safeCheque = (bl.chequeNo || 'Letter').replace(/[^a-zA-Z0-9]+/g, '_');
    const safeInst = (bl.leftSignatoryOrg || order.institutionName || 'Bank')
      .split(/\s+/)
      .slice(0, 2)
      .join('_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    const bankFilename = `Bank_Cheque_${safeCheque}_${safeInst}.pdf`;
    doc.save(bankFilename);
    return bankFilename;
  }

  // Optional Institution Emblem
  if (order.logoDataUrl) {
    try {
      const imgSize = 18;
      const format = order.logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(
        order.logoDataUrl,
        format,
        (pageWidth - imgSize) / 2,
        y,
        imgSize,
        imgSize,
        undefined,
        'FAST'
      );
      y += imgSize + 4;
    } catch {
      // Ignore malformed data URL gracefully
    }
  }

  // Header Block
  doc.setTextColor(0, 0, 0);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(pt(13.5));
  doc.text(order.institutionName.trim() || 'INSTITUTION NAME', pageWidth / 2, y, {
    align: 'center',
  });
  y += mm(6.2);

  if (order.institutionLocation.trim()) {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(pt(12));
    doc.text(order.institutionLocation.trim(), pageWidth / 2, y, { align: 'center' });
    y += isBoldOrderTitle ? mm(8) : mm(6.2);
  }

  const orderTitleText = order.orderTitle.trim() || 'OFFICE ORDER';
  doc.setFont(fontName, isBoldOrderTitle ? 'bold' : 'normal');
  doc.setFontSize(pt(11));
  doc.text(orderTitleText, pageWidth / 2, y, { align: 'center' });
  if (!isBoldOrderTitle) {
    const titleWidth = doc.getTextWidth(orderTitleText);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.32);
    doc.line((pageWidth - titleWidth) / 2, y + 0.9, (pageWidth + titleWidth) / 2, y + 0.9);
  }
  y += mm(5.8);

  const displayDate = getDisplayOrderDate(order);
  doc.setFont(fontName, isBoldOrderTitle ? 'bold' : 'normal');
  doc.setFontSize(pt(10.5));
  doc.text(displayDate, pageWidth / 2, y, { align: 'center' });
  y += mm(9);

  // Opening Sanction Paragraph
  const bodyFontSize = pt(10.2);
  const lineHeight = mm(5.3);
  const openingIndent = layoutStyle === 'particular-amount' ? 10 : 0;

  if (order.useCustomOpeningParagraph && order.customOpeningParagraph.trim()) {
    const segments: TextSegment[] = [
      { text: `${order.fileRefNo.trim()}    `, bold: isRefBold },
      { text: order.customOpeningParagraph.trim(), bold: false },
    ];
    y = renderRichParagraph(
      doc,
      segments,
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      openingIndent,
      true
    );
  } else {
    const payeeText = getResolvedPayeeText(order);
    const purposeText = order.overallPurpose.trim().replace(/\.$/, '');
    const isBoldFigure =
      order.boldAmountInFigure ?? layoutStyle !== 'particular-amount';
    const isBoldWords = Boolean(order.boldAmountInWords);
    const isBoldPayee = Boolean(order.boldPayeeName);

    const annexureSentence =
      layoutStyle === 'lump-sum-annexure' && order.lumpSum?.annexureNote?.trim()
        ? ` ${order.lumpSum.annexureNote.trim()}`
        : '';

    const openingSegments: TextSegment[] =
      order.openingClauseMode === 'not-exceeding'
        ? [
            { text: `${order.fileRefNo.trim()}    `, bold: isRefBold },
            { text: `${order.sanctioningAuthorityPhrase.trim()} `, bold: false },
            { text: formatRsSlash(totals.totalGross), bold: isBoldFigure },
            { text: ' ', bold: false },
            { text: `(${totals.grossInWords})`, bold: isBoldWords },
            { text: ' only is hereby approved and sanctioned in favour of ', bold: false },
            { text: payeeText, bold: isBoldPayee },
            { text: ` ${connector} ${purposeText}.${annexureSentence}`, bold: false },
          ]
        : [
            { text: `${order.fileRefNo.trim()}     `, bold: isRefBold },
            { text: `${order.sanctioningAuthorityPhrase.trim()} `, bold: false },
            { text: formatRsSlash(totals.totalGross), bold: isBoldFigure },
            { text: ' ', bold: false },
            { text: `(${totals.grossInWords})`, bold: isBoldWords },
            { text: ' only in favour of ', bold: false },
            { text: payeeText, bold: isBoldPayee },
            { text: ` ${connector} ${purposeText}.${annexureSentence}`, bold: false },
          ];

    y = renderRichParagraph(
      doc,
      openingSegments,
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      openingIndent,
      true
    );
  }

  y += 2;

  // Table Intro
  if (order.tableIntroText.trim()) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text(order.tableIntroText.trim(), marginLeft, y);
    y += 2.6;
  }

  const RUPEE_PREFIX = '    ';

  // --- LAYOUT 1: Works Bill with Recoveries ---
  if (layoutStyle === 'works-recoveries' && totals.works) {
    const w = totals.works;
    const midColRightX = marginLeft + contentWidth * 0.56;
    const rightColCenterX = marginLeft + contentWidth * 0.81;
    const rowStep = mm(5.4);
    const stmtFontSize = pt(10);

    y += 2;
    doc.setFont(fontName, 'normal');
    doc.setFontSize(stmtFontSize);
    doc.text('Gross Payment of the Bill:', marginLeft, y);
    drawRupeeText(doc, w.grossBillAmount, rightColCenterX, y, fontName, stmtFontSize, false, 'center', true);
    y += rowStep + 2.5;

    doc.setFont(fontName, 'normal');
    doc.text('Work Value:', marginLeft, y);
    drawRupeeText(doc, w.workValue, midColRightX, y, fontName, stmtFontSize, true, 'right', true);
    y += rowStep;

    doc.setFont(fontName, 'normal');
    doc.text('Recoveries:', marginLeft, y);
    y += rowStep;

    const recoveryRows: { label: string; amount: number; topRule?: boolean }[] = [
      { label: `${order.worksBill?.sdPercent ?? 5}% SD:`, amount: w.sdAmount },
      { label: 'Less EMD:', amount: w.emdAmount },
      { label: '', amount: w.netSdAmount, topRule: true },
      { label: `Less ${order.worksBill?.cgstRate ?? 1}% CGST:`, amount: w.cgstAmount },
      { label: `Less ${order.worksBill?.sgstRate ?? 1}% SGST:`, amount: w.sgstAmount },
      {
        label: `Less ${order.worksBill?.labourCessRate ?? 1}% Labour Cess:`,
        amount: w.labourCessAmount,
      },
      { label: `Less ${order.worksBill?.itRate ?? 2}% IT:`, amount: w.itAmount },
    ];

    recoveryRows.forEach((r) => {
      if (r.topRule) {
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.2);
        doc.line(midColRightX - 30, y - 3.6, midColRightX, y - 3.6);
      }
      if (r.label) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(stmtFontSize);
        doc.text(r.label, marginLeft, y);
      }
      drawRupeeText(doc, r.amount, midColRightX, y, fontName, stmtFontSize, false, 'right', true);
      y += rowStep;
    });

    // Total Recoveries
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.25);
    doc.line(midColRightX - 32, y - 3.6, midColRightX, y - 3.6);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(stmtFontSize);
    doc.text('Total:', marginLeft + contentWidth * 0.29, y, { align: 'right' });
    drawRupeeText(doc, w.totalRecoveries, midColRightX, y, fontName, stmtFontSize, true, 'right', true);
    y += rowStep + 0.6;

    // Net Payment
    doc.setFont(fontName, 'bold');
    doc.setFontSize(stmtFontSize);
    doc.text('Net Payment :', midColRightX, y, { align: 'right' });
    drawRupeeText(doc, w.netPayment, rightColCenterX, y, fontName, stmtFontSize, true, 'center', true);
    y += rowStep + 2.5;

    // Net Payment in words centered
    doc.setFont(fontName, 'normal');
    doc.setFontSize(stmtFontSize);
    doc.text(`(${totals.netInWords}) only.`, pageWidth / 2, y, { align: 'center' });
    y += 7.5;
  } else if (layoutStyle === 'particular-amount') {
    // --- LAYOUT 2: Particular & Amount Table ---
    const tableBody: (
      | string
      | { content: string; colSpan?: number; styles?: Record<string, unknown> }
    )[][] = totals.rows.map((r, index) => [
      String(index + 1),
      r.item.partyName || '-',
      `${RUPEE_PREFIX}${formatIndianNumber(r.item.grossAmount, showDecimals)}`,
    ]);

    tableBody.push([
      {
        content: 'Total:',
        colSpan: 2,
        styles: { halign: 'right', fontStyle: 'bold' },
      },
      {
        content: `${RUPEE_PREFIX}${formatIndianNumber(totals.totalGross, showDecimals)}`,
        styles: { halign: 'right', fontStyle: 'normal' },
      },
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [[order.columnLabels.slNo, order.columnLabels.party, order.columnLabels.grossAmount]],
      body: tableBody,
      theme: 'grid',
      margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
      styles: {
        font: fontName,
        fontSize: pt(10),
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.28,
        cellPadding: { top: 2.2, right: 3, bottom: 2.2, left: 3 },
        valign: 'middle',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.28,
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { halign: 'center' },
        2: { cellWidth: 42, halign: 'right' },
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const rawText = Array.isArray(data.cell.text)
            ? data.cell.text.join('')
            : String(data.cell.text || '');
          if (rawText.startsWith(RUPEE_PREFIX) && rawText.trim().length > 0) {
            const numText = rawText.trim();
            doc.setFont(fontName, data.cell.styles.fontStyle || 'normal');
            const cellFontSize = data.cell.styles.fontSize || 10;
            doc.setFontSize(cellFontSize);
            const numWidth = doc.getTextWidth(numText);
            const padRight =
              typeof data.cell.padding === 'function' ? data.cell.padding('right') : 3;
            const rupeeX = data.cell.x + data.cell.width - padRight - numWidth - 3.2;
            const baselineY = data.cell.y + data.cell.height / 2 + cellFontSize * 0.352778 * 0.34;
            drawVectorRupee(doc, Math.max(data.cell.x + 1.5, rupeeX), baselineY, cellFontSize);
          }
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? y + 30;
    y = finalY + 9;
  } else if (layoutStyle === 'vendor-table') {
    // --- LAYOUT 3: Standard Multi-Column Vendor Table ---
    const hasD1 = order.taxMode !== 'none' && order.showDeduction1;
    const hasD2 = order.taxMode !== 'none' && order.showDeduction2;
    const hasAnyDeduction = hasD1 || hasD2;

    const headers: string[] = [
      order.columnLabels.slNo,
      order.columnLabels.party,
      order.columnLabels.purpose,
      order.columnLabels.reference,
      order.columnLabels.grossAmount,
    ];
    if (hasD1) headers.push(order.columnLabels.deduction1);
    if (hasD2) headers.push(order.columnLabels.deduction2);
    if (hasAnyDeduction) headers.push(order.columnLabels.netPayment);

    const tableBody: (
      | string
      | { content: string; colSpan?: number; styles?: Record<string, unknown> }
    )[][] = totals.rows.map((r, index) => {
      const row: string[] = [
        String(index + 1),
        r.item.partyName || '-',
        r.item.purpose || '-',
        r.item.referenceNo || '-',
        `${RUPEE_PREFIX}${formatIndianNumber(r.item.grossAmount, showDecimals)}`,
      ];
      if (hasD1) row.push(`${RUPEE_PREFIX}${formatIndianNumber(r.deduction1, showDecimals)}`);
      if (hasD2) row.push(`${RUPEE_PREFIX}${formatIndianNumber(r.deduction2, showDecimals)}`);
      if (hasAnyDeduction)
        row.push(`${RUPEE_PREFIX}${formatIndianNumber(r.netPayment, showDecimals)}`);
      return row;
    });

    const showSubTotals = !hasAnyDeduction || order.showTotalInGrossColumn;
    const totalLabelColSpan = showSubTotals ? 4 : 5 + (hasD1 ? 1 : 0) + (hasD2 ? 1 : 0);

    const totalRow: (
      | string
      | { content: string; colSpan?: number; styles?: Record<string, unknown> }
    )[] = [
      {
        content: 'Total',
        colSpan: totalLabelColSpan,
        styles: { halign: 'right', fontStyle: 'bold' },
      },
    ];
    if (showSubTotals) {
      totalRow.push({
        content: `${RUPEE_PREFIX}${formatIndianNumber(totals.totalGross, showDecimals)}`,
        styles: { halign: 'right', fontStyle: !hasAnyDeduction ? 'bold' : 'normal' },
      });
    }
    if (showSubTotals && hasD1) {
      totalRow.push({
        content: `${RUPEE_PREFIX}${formatIndianNumber(totals.totalDeduction1, showDecimals)}`,
        styles: { halign: 'right' },
      });
    }
    if (showSubTotals && hasD2) {
      totalRow.push({
        content: `${RUPEE_PREFIX}${formatIndianNumber(totals.totalDeduction2, showDecimals)}`,
        styles: { halign: 'right' },
      });
    }
    if (hasAnyDeduction) {
      totalRow.push({
        content: `${RUPEE_PREFIX}${formatIndianNumber(totals.totalNet, showDecimals)}`,
        styles: { halign: 'right', fontStyle: 'bold' },
      });
    }
    tableBody.push(totalRow);

    const colStyles: Record<number, { cellWidth?: number; halign?: 'left' | 'center' | 'right' }> =
      {};
    if (headers.length === 8) {
      colStyles[0] = { cellWidth: 10, halign: 'center' };
      colStyles[1] = { cellWidth: contentWidth * 0.16, halign: 'left' };
      colStyles[2] = { cellWidth: contentWidth * 0.14, halign: 'left' };
      colStyles[3] = { cellWidth: contentWidth * 0.165, halign: 'left' };
      colStyles[4] = { cellWidth: contentWidth * 0.145, halign: 'right' };
      colStyles[5] = { cellWidth: contentWidth * 0.1, halign: 'right' };
      colStyles[6] = { cellWidth: contentWidth * 0.1, halign: 'right' };
      colStyles[7] = { cellWidth: contentWidth * 0.134, halign: 'right' };
    } else if (headers.length === 7) {
      colStyles[0] = { cellWidth: 10, halign: 'center' };
      colStyles[1] = { cellWidth: contentWidth * 0.21, halign: 'left' };
      colStyles[2] = { cellWidth: contentWidth * 0.18, halign: 'left' };
      colStyles[3] = { cellWidth: contentWidth * 0.17, halign: 'left' };
      colStyles[4] = { cellWidth: contentWidth * 0.14, halign: 'right' };
      colStyles[5] = { cellWidth: contentWidth * 0.115, halign: 'right' };
      colStyles[6] = { cellWidth: contentWidth * 0.13, halign: 'right' };
    } else {
      colStyles[0] = { cellWidth: 11, halign: 'center' };
      colStyles[1] = { cellWidth: contentWidth * 0.29, halign: 'left' };
      colStyles[2] = { cellWidth: contentWidth * 0.28, halign: 'left' };
      colStyles[3] = { cellWidth: contentWidth * 0.19, halign: 'left' };
      colStyles[4] = { cellWidth: contentWidth * 0.175, halign: 'right' };
    }

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: tableBody,
      theme: 'grid',
      margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
      styles: {
        font: fontName,
        fontSize: pt(9.2),
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.28,
        cellPadding: { top: 2.2, right: 2.2, bottom: 2.2, left: 2.2 },
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.28,
      },
      columnStyles: colStyles,
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const rawText = Array.isArray(data.cell.text)
            ? data.cell.text.join('')
            : String(data.cell.text || '');
          if (rawText.startsWith(RUPEE_PREFIX) && rawText.trim().length > 0) {
            const numText = rawText.trim();
            doc.setFont(fontName, data.cell.styles.fontStyle || 'normal');
            const cellFontSize = data.cell.styles.fontSize || 9.2;
            doc.setFontSize(cellFontSize);
            const numWidth = doc.getTextWidth(numText);
            const padRight =
              typeof data.cell.padding === 'function' ? data.cell.padding('right') : 2.2;
            const rupeeX = data.cell.x + data.cell.width - padRight - numWidth - 3.2;
            const baselineY = data.cell.y + data.cell.height / 2 + cellFontSize * 0.352778 * 0.34;
            drawVectorRupee(doc, Math.max(data.cell.x + 1.5, rupeeX), baselineY, cellFontSize);
          }
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? y + 30;
    y = finalY + 9.5;
  } else {
    // --- LAYOUT 4: Lump-Sum Annexure (No Table) ---
    y += 5;
  }

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  // Delegation & Account Head Clause
  ensureSpace(26);
  const cleanHead = order.accountHead.trim().replace(/^["“]+|["”]+$/g, '');

  if (order.useCustomDelegationParagraph && order.customDelegationParagraph.trim()) {
    y = renderRichParagraph(
      doc,
      [{ text: order.customDelegationParagraph.trim(), bold: false }],
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      10,
      true
    );
  } else if (order.delegationStyle === 'two-line-works') {
    y = renderRichParagraph(
      doc,
      [
        {
          text: `The amount is sanctioned by ${order.delegationAuthority || 'Vice Chancellor'} at ${order.noteSheetNo.trim()} dated ${formatSlashDate(order.noteSheetDateIso)}.`,
          bold: false,
        },
      ],
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      0,
      true
    );
    y += 2;
    y = renderRichParagraph(
      doc,
      [
        {
          text: `The expenditure would be debitable to the head of Account "${cleanHead}" for the year ${order.financialYear.trim()}.`,
          bold: false,
        },
      ],
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      0,
      true
    );
  } else if (order.delegationStyle === 'two-line-deposit') {
    y = renderRichParagraph(
      doc,
      [
        {
          text: `The amount is approved by ${order.delegationAuthority || 'Registrar'} at ${order.noteSheetNo.trim()} dated ${formatDashDate(order.noteSheetDateIso)} as per the ${order.delegationBody.trim()}.`,
          bold: false,
        },
      ],
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      10,
      true
    );
    y += 3;
    y = renderRichParagraph(
      doc,
      [
        {
          text: `The amount is debitable to the ${order.accountHead.trim()} for the year ${order.financialYear.trim()}.`,
          bold: false,
        },
      ],
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      10,
      true
    );
  } else if (order.delegationStyle === 'combined-account') {
    const combinedAccountSegments: TextSegment[] = [
      {
        text: `This sanction has been accorded in exercise of the powers delegated by ${order.delegationBody.trim()} at ${order.noteSheetNo.trim()} dated ${formatSlashDate(order.noteSheetDateIso)}. The expenditure would be debitable to the Account "${cleanHead}" for the year ${order.financialYear.trim()}.`,
        bold: false,
      },
    ];
    y = renderRichParagraph(
      doc,
      combinedAccountSegments,
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      10,
      true
    );
  } else {
    const delegationSegments: TextSegment[] = [
      {
        text: `This sanction has been accorded in exercise of the powers delegated by ${order.delegationBody.trim()} at ${order.noteSheetNo.trim()} dated ${formatSlashDate(order.noteSheetDateIso)}. The expenditure would be debitable to the head of Account `,
        bold: false,
      },
      {
        text: `"${cleanHead}"`,
        bold: true,
      },
      {
        text: ` for the year ${order.financialYear.trim()}.`,
        bold: false,
      },
    ];
    y = renderRichParagraph(
      doc,
      delegationSegments,
      marginLeft,
      y,
      contentWidth,
      fontName,
      bodyFontSize,
      lineHeight,
      10,
      true
    );
  }

  // Right-Aligned Authority Approval Block
  if (order.showApprovalBlock) {
    ensureSpace(30);
    y += 7;
    const rightColCenterX = pageWidth - marginRight - 32;
    doc.setFont(fontName, 'normal');
    doc.setFontSize(bodyFontSize);
    if (order.approvalLine1.trim()) {
      doc.text(order.approvalLine1.trim(), rightColCenterX, y, { align: 'center' });
      y += mm(5.2);
    }
    if (order.approvalLine2.trim()) {
      doc.text(order.approvalLine2.trim(), rightColCenterX, y, { align: 'center' });
      y += mm(5.2);
    }
    if (order.approvalAuthorityTitle.trim()) {
      doc.text(order.approvalAuthorityTitle.trim(), rightColCenterX, y, { align: 'center' });
      y += mm(5.2);
    }
    if (order.approvalInstitution?.trim()) {
      doc.text(order.approvalInstitution.trim(), rightColCenterX, y, { align: 'center' });
      y += mm(5.2);
    }
  }

  // Optional Endorsement Memo Bar (Works Bill Style)
  if (order.showEndorsementBar) {
    ensureSpace(10);
    y += 4;
    const rightColCenterX = pageWidth - marginRight - 32;
    const cleanEndorsementRef = order.fileRefNo.trim().replace(/:$/, '');
    const endorsementDate = displayDate.replace(/,\s+(\d{4})$/, ' $1');
    doc.setFont(fontName, 'normal');
    doc.setFontSize(pt(10));
    doc.text(cleanEndorsementRef, marginLeft, y);
    doc.text(endorsementDate, rightColCenterX, y, { align: 'center' });
    y += mm(5.5);
  }

  // Copy To Distribution Block
  const copyEntries = order.copyToList.map((c) => c.trim()).filter(Boolean);
  if (copyEntries.length > 0) {
    ensureSpace(14 + copyEntries.length * mm(5.2));
    y += order.showEndorsementBar ? 2 : 6;
    doc.setFont(fontName, 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text(order.copyToTitle.trim() || 'Copy to:', marginLeft, y);
    y += mm(5.4);

    const entryIndent = layoutStyle === 'particular-amount' ? 12 : 6;
    const numGap = layoutStyle === 'particular-amount' ? 9 : 4.5;

    copyEntries.forEach((entry, idx) => {
      doc.text(`${idx + 1}.`, marginLeft + entryIndent, y);
      const wrapped = doc.splitTextToSize(entry, contentWidth * 0.65);
      doc.text(wrapped, marginLeft + entryIndent + numGap, y);
      y += wrapped.length * mm(5.1);
    });
  }

  // Bottom-Right Issuing Officer Signature Block
  ensureSpace(24);
  y += 9;
  const sigCenterX = pageWidth - marginRight - 32;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(bodyFontSize);
  if (order.issuerName.trim()) {
    doc.text(order.issuerName.trim(), sigCenterX, y, { align: 'center' });
    y += mm(5.2);
  }
  if (order.issuerDesignation.trim()) {
    doc.text(order.issuerDesignation.trim(), sigCenterX, y, { align: 'center' });
    y += mm(5.2);
  }
  if (order.issuerInstitution.trim()) {
    doc.text(order.issuerInstitution.trim(), sigCenterX, y, { align: 'center' });
  }

  const safeOrderSlug = (order.orderTitle || 'Sanction_Order')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const safeInstSlug = (order.institutionName || 'Govt')
    .split(/\s+/)
    .slice(0, 2)
    .join('_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `${safeOrderSlug}_${safeInstSlug}.pdf`;

  doc.save(filename);
  return filename;
}
