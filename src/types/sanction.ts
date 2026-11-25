export type TemplateId =
  | 'gem-gst-tds'
  | 'works-bill-recoveries'
  | 'pg-sd-refund'
  | 'student-sd-refund'
  | 'bank-forwarding-letter'
  | 'gem-igst-tds'
  | 'employee-reimbursement'
  | 'works-amc-tds'
  | 'direct-grant';

export type OrderLayoutStyle =
  | 'vendor-table'
  | 'works-recoveries'
  | 'particular-amount'
  | 'lump-sum-annexure'
  | 'bank-letter';

export type TaxCalculationMode = 'gst-inclusive-tds' | 'direct-gross-percent' | 'flat-manual' | 'none';

export type DocumentFontFamily =
  | 'sans'
  | 'arial'
  | 'serif'
  | 'georgia'
  | 'garamond'
  | 'courier';

export type PageMarginPreset = 'standard' | 'compact' | 'formal' | 'custom';

export interface PageMargins {
  top: number; // mm
  right: number; // mm
  bottom: number; // mm
  left: number; // mm
}

export interface ColumnLabels {
  slNo: string;
  party: string;
  purpose: string;
  reference: string;
  grossAmount: string;
  deduction1: string;
  deduction2: string;
  netPayment: string;
}

export interface SanctionLineItem {
  id: string;
  partyName: string;
  purpose: string;
  referenceNo: string;
  grossAmount: number;
  gstRatePercent: number; // e.g. 18, 12, 5, 28, 0
  manualDeduction1?: number | null;
  manualDeduction2?: number | null;
  useManualDeductions: boolean;
}

export interface WorksBillConfig {
  grossBillAmount: number;
  workValueDivisorPercent: number; // e.g. 19 (18% GST + 1% Cess)
  useManualWorkValue: boolean;
  manualWorkValue: number;
  sdPercent: number; // e.g. 5 (%) of Gross Bill
  emdAmount: number; // Less EMD
  cgstRate: number; // e.g. 1 (%) of Work Value
  sgstRate: number; // e.g. 1 (%) of Work Value
  labourCessRate: number; // e.g. 1 (%) of Work Value
  itRate: number; // e.g. 2 (%) of Work Value
  useManualRecoveries: boolean;
  manualSd?: number;
  manualCgst?: number;
  manualSgst?: number;
  manualLabourCess?: number;
  manualIt?: number;
}

export interface LumpSumConfig {
  amount: number;
  annexureNote: string; // e.g., The list of students is enclosed as Annexure-I.
}

export interface BankLetterConfig {
  showLetterhead: boolean;
  recipientLine1: string; // To
  recipientLine2: string; // Chief Manager
  recipientLine3: string; // State Bank of India
  recipientLine4: string; // MU Campus
  salutation: string; // Sir/Madam,
  bodyPrefix: string; // Enclose herewith is Cheque no.
  chequeNo: string; // 496288
  chequeDateIso: string; // 2025-11-26
  chequeAmount: number; // 310000
  bodySuffix: string; // only for crediting to the individual accounts listed on Annexure-I.
  leftSignatoryTitle: string; // Registrar
  leftSignatoryOrg: string; // Manipur University
  rightSignatoryTitle: string; // Finance Officer
  rightSignatoryOrg: string; // Manipur University
}

export interface ComputedWorksBill {
  grossBillAmount: number;
  workValue: number;
  sdAmount: number;
  emdAmount: number;
  netSdAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  labourCessAmount: number;
  itAmount: number;
  totalRecoveries: number;
  netPayment: number;
}

export interface ComputedLineItem {
  item: SanctionLineItem;
  taxableValue: number;
  deduction1: number;
  deduction2: number;
  netPayment: number;
}

export interface SanctionOrder {
  id: string;
  templateId: TemplateId;
  templateName: string;
  layoutStyle?: OrderLayoutStyle;
  updatedAt: string;

  // Header
  institutionName: string;
  institutionLocation: string;
  orderTitle: string; // e.g., OFFICE ORDER NO. C/28
  orderTitleStyle?: 'underlined' | 'bold';
  orderDateIso: string; // YYYY-MM-DD
  useCustomOrderDateText: boolean;
  customOrderDateText: string; // e.g., Dated the 19th February, 2026
  logoDataUrl: string | null;

  // Opening Sanction Clause
  fileRefNo: string; // e.g., No. MU/AP/MU/MUSU 2025-26/CM-01:
  openingRefBold?: boolean;
  boldAmountInFigure?: boolean;
  boldAmountInWords?: boolean;
  boldPayeeName?: boolean;
  openingClauseMode?: 'standard' | 'not-exceeding';
  openingClauseConnector?: string; // e.g., "on account of" | "being payment of 1st and Final bill for the work"
  sanctioningAuthorityPhrase: string; // e.g., The Hon'ble Vice Chancellor is pleased to accord a sanction for incurring expenditure of
  payeeSummaryOverride: string; // optional override if multiple firms
  overallPurpose: string; // e.g., Supply of Computers.
  useCustomOpeningParagraph: boolean;
  customOpeningParagraph: string;
  tableIntroText: string; // e.g., The details are:

  // Table & Tax Rules (for vendor-table & particular-amount)
  columnLabels: ColumnLabels;
  taxMode: TaxCalculationMode;
  showDeduction1: boolean;
  showDeduction2: boolean;
  deduction1Rate: number; // e.g. 1 (%)
  deduction2Rate: number; // e.g. 1 (%)
  defaultGstRate: number; // e.g. 18 (%)
  items: SanctionLineItem[];

  // Works Bill Recoveries (for works-recoveries layout)
  worksBill?: WorksBillConfig;

  // Lump-Sum Annexure Sanction (for student-sd-refund layout)
  lumpSum?: LumpSumConfig;

  // Bank Forwarding Letter (for bank-letter layout)
  bankLetter?: BankLetterConfig;

  // Delegation & Account Head Clause
  delegationStyle?: 'combined' | 'combined-account' | 'two-line-works' | 'two-line-deposit';
  delegationAuthority?: string; // e.g., Vice Chancellor | Registrar
  delegationBody: string; // e.g., Manipur University | Delegation of Financial Power, MU
  noteSheetNo: string; // e.g., Note No.26
  noteSheetDateIso: string; // YYYY-MM-DD
  accountHead: string; // e.g., Capital Assets [35] - "Other Infrastructure including Furniture and Fixture"
  financialYear: string; // e.g., 2025-26
  useCustomDelegationParagraph: boolean;
  customDelegationParagraph: string;

  // Approval Block (Right-aligned middle)
  showApprovalBlock: boolean;
  approvalLine1: string; // By order etc.,
  approvalLine2: string; // Sd/-
  approvalAuthorityTitle: string; // Vice Chancellor
  approvalInstitution?: string; // Manipur University (optional 4th line)

  // Optional Endorsement Memo Bar above Copy To (used in Works Bill orders)
  showEndorsementBar?: boolean;

  // Copy To Distribution
  copyToTitle: string; // Copy to:
  copyToList: string[];

  // Issuing Officer Signature Block (Bottom-right)
  issuerName: string; // (M. Sharat Singh)
  issuerDesignation: string; // Asst. Registrar (Finance)
  issuerInstitution: string; // Manipur University

  // Print & Styling options
  fontFamily: DocumentFontFamily;
  fontSizePt?: number; // e.g., 9 to 14 (default 11)
  marginPreset: PageMarginPreset;
  customMargins?: PageMargins;
  showTotalInGrossColumn: boolean;
  showDecimals?: boolean;
}

export interface SanctionTemplateMeta {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  taxSummary: string;
  columnsSummary: string;
  createOrder: () => SanctionOrder;
}
