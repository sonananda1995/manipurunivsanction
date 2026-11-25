import type {
  ComputedLineItem,
  ComputedWorksBill,
  SanctionLineItem,
  SanctionOrder,
  WorksBillConfig,
} from '../types/sanction';

/**
 * Formats a number using the Indian numbering system (e.g., 4,14,179 or 14,50,695.00).
 */
export function formatIndianNumber(value: number, forceDecimals = false): string {
  if (!Number.isFinite(value)) return forceDecimals ? '0.00' : '0';
  const rounded = forceDecimals ? Math.round(value * 100) / 100 : Math.round(value);
  return rounded.toLocaleString('en-IN', {
    minimumFractionDigits: forceDecimals ? 2 : 0,
    maximumFractionDigits: forceDecimals ? 2 : 0,
  });
}

export function formatRupeeSymbol(value: number, forceDecimals = false): string {
  return `₹ ${formatIndianNumber(value, forceDecimals)}`;
}

export function formatRsSlash(value: number): string {
  return `Rs.${formatIndianNumber(value, false)}/-`;
}

const ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

function twoDigitWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one > 0 ? `${TENS[ten]}-${ONES[one]}` : TENS[ten];
}

function threeDigitWords(n: number): string {
  if (n === 0) return '';
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred > 0) parts.push(`${ONES[hundred]} hundred`);
  if (rest > 0) parts.push(twoDigitWords(rest));
  return parts.join(' ');
}

/**
 * Converts a rupee amount into Indian English words (lakh / crore system),
 * matching standard Indian government sanction order style:
 * e.g., 414179 -> "Rupees four lakh fourteen thousand one hundred seventy-nine"
 */
export function numberToIndianWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Rupees zero';
  }

  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  const segments: string[] = [];

  const crore = Math.floor(rupees / 10000000);
  const afterCrore = rupees % 10000000;
  const lakh = Math.floor(afterCrore / 100000);
  const afterLakh = afterCrore % 100000;
  const thousand = Math.floor(afterLakh / 1000);
  const remainder = afterLakh % 1000;

  if (crore > 0) {
    if (crore >= 100) {
      segments.push(`${threeDigitWords(crore)} crore`);
    } else {
      segments.push(`${twoDigitWords(crore)} crore`);
    }
  }
  if (lakh > 0) {
    segments.push(`${twoDigitWords(lakh)} lakh`);
  }
  if (thousand > 0) {
    segments.push(`${twoDigitWords(thousand)} thousand`);
  }
  if (remainder > 0) {
    segments.push(threeDigitWords(remainder));
  }

  const rupeeWords = segments.length > 0 ? segments.join(' ') : 'zero';
  if (paise > 0) {
    return `Rupees ${rupeeWords} and ${twoDigitWords(paise)} paise`;
  }
  return `Rupees ${rupeeWords}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Formats YYYY-MM-DD into "Dated the 19th February, 2026"
 */
export function formatGovernmentOrdinalDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return 'Dated the ____';
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const monthName = MONTHS[m - 1] ?? '';
  return `Dated the ${d}${getOrdinalSuffix(d)} ${monthName}, ${y}`;
}

/**
 * Formats YYYY-MM-DD into "19/02/2026"
 */
export function formatSlashDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '__/__/____';
  }
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formats YYYY-MM-DD into "18-11-2026"
 */
export function formatDashDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '__-__-____';
  }
  const [y, m, d] = isoDate.split('-');
  return `${d}-${m}-${y}`;
}

export const DEFAULT_WORKS_BILL: WorksBillConfig = {
  grossBillAmount: 1450695,
  workValueDivisorPercent: 19,
  useManualWorkValue: false,
  manualWorkValue: 1219071,
  sdPercent: 5,
  emdAmount: 21530,
  cgstRate: 1,
  sgstRate: 1,
  labourCessRate: 1,
  itRate: 2,
  useManualRecoveries: false,
};

/**
 * Computes Works Bill recoveries matching Manipur University Engineering / Civil Works Orders:
 *   Work Value = round(Gross / (1 + divisor% / 100))   [default 19% = 18% GST + 1% Cess]
 *   SD = round(Gross * sdPercent / 100)
 *   Net SD = max(0, SD - EMD)
 *   CGST / SGST / Labour Cess / IT = round(WorkValue * rate / 100)
 *   Total Recoveries = Net SD + CGST + SGST + Labour Cess + IT
 *   Net Payment = Gross - Total Recoveries
 */
export function computeWorksBill(config?: WorksBillConfig): ComputedWorksBill {
  const c = config ?? DEFAULT_WORKS_BILL;
  const gross = Number.isFinite(c.grossBillAmount) ? Math.max(0, Math.round(c.grossBillAmount)) : 0;
  const divisor = Number.isFinite(c.workValueDivisorPercent)
    ? Math.max(0, c.workValueDivisorPercent)
    : 0;

  const autoWorkValue = divisor > 0 ? Math.round(gross / (1 + divisor / 100)) : gross;
  const workValue = c.useManualWorkValue
    ? Math.max(0, Math.round(c.manualWorkValue || 0))
    : autoWorkValue;

  const autoSd = Math.round((gross * (c.sdPercent || 0)) / 100);
  const sdAmount = c.useManualRecoveries && c.manualSd != null ? Math.max(0, Math.round(c.manualSd)) : autoSd;
  const emdAmount = Math.max(0, Math.round(c.emdAmount || 0));
  const netSdAmount = Math.max(0, sdAmount - emdAmount);

  const cgstAmount =
    c.useManualRecoveries && c.manualCgst != null
      ? Math.max(0, Math.round(c.manualCgst))
      : Math.round((workValue * (c.cgstRate || 0)) / 100);

  const sgstAmount =
    c.useManualRecoveries && c.manualSgst != null
      ? Math.max(0, Math.round(c.manualSgst))
      : Math.round((workValue * (c.sgstRate || 0)) / 100);

  const labourCessAmount =
    c.useManualRecoveries && c.manualLabourCess != null
      ? Math.max(0, Math.round(c.manualLabourCess))
      : Math.round((workValue * (c.labourCessRate || 0)) / 100);

  const itAmount =
    c.useManualRecoveries && c.manualIt != null
      ? Math.max(0, Math.round(c.manualIt))
      : Math.round((workValue * (c.itRate || 0)) / 100);

  const totalRecoveries = netSdAmount + cgstAmount + sgstAmount + labourCessAmount + itAmount;
  const netPayment = Math.max(0, gross - totalRecoveries);

  return {
    grossBillAmount: gross,
    workValue,
    sdAmount,
    emdAmount,
    netSdAmount,
    cgstAmount,
    sgstAmount,
    labourCessAmount,
    itAmount,
    totalRecoveries,
    netPayment,
  };
}

/**
 * Computes deductions and net payment for a single sanction line item.
 */
export function computeLineItem(
  item: SanctionLineItem,
  order: Pick<
    SanctionOrder,
    'taxMode' | 'showDeduction1' | 'showDeduction2' | 'deduction1Rate' | 'deduction2Rate'
  >
): ComputedLineItem {
  const gross = Number.isFinite(item.grossAmount) ? Math.max(0, item.grossAmount) : 0;
  const gstRate = Number.isFinite(item.gstRatePercent) ? Math.max(0, item.gstRatePercent) : 0;
  const taxableValue = gstRate > 0 ? gross / (1 + gstRate / 100) : gross;

  let deduction1 = 0;
  let deduction2 = 0;

  if (order.taxMode === 'none') {
    deduction1 = 0;
    deduction2 = 0;
  } else if (item.useManualDeductions || order.taxMode === 'flat-manual') {
    deduction1 = order.showDeduction1 ? Math.max(0, Math.round(item.manualDeduction1 ?? 0)) : 0;
    deduction2 = order.showDeduction2 ? Math.max(0, Math.round(item.manualDeduction2 ?? 0)) : 0;
  } else if (order.taxMode === 'gst-inclusive-tds') {
    deduction1 = order.showDeduction1
      ? Math.round((taxableValue * (order.deduction1Rate || 0)) / 100)
      : 0;
    deduction2 = order.showDeduction2
      ? Math.round((taxableValue * (order.deduction2Rate || 0)) / 100)
      : 0;
  } else if (order.taxMode === 'direct-gross-percent') {
    deduction1 = order.showDeduction1
      ? Math.round((gross * (order.deduction1Rate || 0)) / 100)
      : 0;
    deduction2 = order.showDeduction2
      ? Math.round((gross * (order.deduction2Rate || 0)) / 100)
      : 0;
  }

  const netPayment = Math.max(0, Math.round(gross) - deduction1 - deduction2);

  return {
    item,
    taxableValue,
    deduction1,
    deduction2,
    netPayment,
  };
}

export interface OrderTotals {
  rows: ComputedLineItem[];
  works: ComputedWorksBill | null;
  totalGross: number;
  totalDeduction1: number;
  totalDeduction2: number;
  totalDeductions: number;
  totalNet: number;
  grossInWords: string;
  netInWords: string;
}

export function computeOrderTotals(order: SanctionOrder): OrderTotals {
  if (order.layoutStyle === 'works-recoveries') {
    const works = computeWorksBill(order.worksBill);
    return {
      rows: [],
      works,
      totalGross: works.grossBillAmount,
      totalDeduction1: works.netSdAmount,
      totalDeduction2: works.cgstAmount + works.sgstAmount + works.labourCessAmount + works.itAmount,
      totalDeductions: works.totalRecoveries,
      totalNet: works.netPayment,
      grossInWords: numberToIndianWords(works.grossBillAmount),
      netInWords: numberToIndianWords(works.netPayment),
    };
  }

  if (order.layoutStyle === 'lump-sum-annexure') {
    const amt = Math.max(0, Math.round(order.lumpSum?.amount ?? 0));
    return {
      rows: [],
      works: null,
      totalGross: amt,
      totalDeduction1: 0,
      totalDeduction2: 0,
      totalDeductions: 0,
      totalNet: amt,
      grossInWords: numberToIndianWords(amt),
      netInWords: numberToIndianWords(amt),
    };
  }

  if (order.layoutStyle === 'bank-letter') {
    const amt = Math.max(0, Math.round(order.bankLetter?.chequeAmount ?? 0));
    return {
      rows: [],
      works: null,
      totalGross: amt,
      totalDeduction1: 0,
      totalDeduction2: 0,
      totalDeductions: 0,
      totalNet: amt,
      grossInWords: numberToIndianWords(amt),
      netInWords: numberToIndianWords(amt),
    };
  }

  const rows = order.items.map((item) => computeLineItem(item, order));
  const totalGross = rows.reduce((acc, r) => acc + Math.round(r.item.grossAmount || 0), 0);
  const totalDeduction1 = rows.reduce((acc, r) => acc + r.deduction1, 0);
  const totalDeduction2 = rows.reduce((acc, r) => acc + r.deduction2, 0);
  const totalNet = rows.reduce((acc, r) => acc + r.netPayment, 0);

  return {
    rows,
    works: null,
    totalGross,
    totalDeduction1,
    totalDeduction2,
    totalDeductions: totalDeduction1 + totalDeduction2,
    totalNet,
    grossInWords: numberToIndianWords(totalGross),
    netInWords: numberToIndianWords(totalNet),
  };
}

export function getDisplayOrderDate(order: SanctionOrder): string {
  if (order.useCustomOrderDateText && order.customOrderDateText.trim()) {
    return order.customOrderDateText.trim();
  }
  return formatGovernmentOrdinalDate(order.orderDateIso);
}

export function getResolvedPayeeText(order: SanctionOrder): string {
  if (order.layoutStyle === 'bank-letter' && order.bankLetter) {
    return [order.bankLetter.recipientLine3, order.bankLetter.recipientLine4]
      .filter(Boolean)
      .join(', ') || 'Bank';
  }
  if (order.payeeSummaryOverride.trim()) {
    return order.payeeSummaryOverride.trim();
  }
  const nonEmptyParties = order.items.map((i) => i.partyName.trim()).filter(Boolean);
  if (nonEmptyParties.length === 0) {
    return 'the concerned party';
  }
  if (nonEmptyParties.length === 1) {
    return nonEmptyParties[0];
  }
  return 'the firms/beneficiaries detailed below';
}

/**
 * Increments the trailing integer in an order/reference string.
 */
export function incrementTrailingNumber(input: string): string {
  const match = input.match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return input;
  const [, prefix, numStr, suffix] = match;
  const nextNum = String(Number(numStr) + 1).padStart(numStr.length, '0');
  return `${prefix}${nextNum}${suffix}`;
}
