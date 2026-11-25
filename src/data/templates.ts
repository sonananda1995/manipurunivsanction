import type { SanctionOrder, SanctionTemplateMeta, TemplateId } from '../types/sanction';

function makeId(prefix = 'ord'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createManipurGemOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'gem-gst-tds',
    templateName: 'GeM / Vendor Procurement (CGST + SGST TDS)',
    layoutStyle: 'vendor-table',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. C/28',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-19',
    useCustomOrderDateText: false,
    customOrderDateText: 'Dated the 19th February, 2026',
    logoDataUrl: null,

    fileRefNo: 'No. MU/AP/MU/MUSU 2025-26/CM-01:',
    openingRefBold: true,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      "The Hon'ble Vice Chancellor is pleased to accord a sanction for incurring expenditure of",
    payeeSummaryOverride: 'M/s Khushi Computer',
    overallPurpose: 'Supply of Computers.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: 'The details are:',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Name of the Firms',
      purpose: 'Purpose',
      reference: 'GEM Invoice Number',
      grossAmount: 'Total Amount including GST',
      deduction1: 'Less 1% CGST',
      deduction2: 'Less 1% SGST',
      netPayment: 'Net Payment',
    },
    taxMode: 'gst-inclusive-tds',
    showDeduction1: true,
    showDeduction2: true,
    deduction1Rate: 1,
    deduction2Rate: 1,
    defaultGstRate: 18,
    items: [
      {
        id: makeId('row'),
        partyName: 'M/S Khushi Computer',
        purpose: 'Desktop Computer',
        referenceNo: 'GEM-69891635',
        grossAmount: 414179,
        gstRatePercent: 18,
        manualDeduction1: null,
        manualDeduction2: null,
        useManualDeductions: false,
      },
    ],

    delegationStyle: 'combined',
    delegationAuthority: 'Vice Chancellor',
    delegationBody: 'Manipur University',
    noteSheetNo: 'Note No.26',
    noteSheetDateIso: '2026-02-19',
    accountHead: 'Capital Assets [35] - “Other Infrastructure including Furniture and Fixture',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Vice Chancellor',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, Manipur University',
      'Registrar, Manipur University.',
      'Finance Officer, MU',
      'M/S Khushi Computer,',
      'The Relevant File.',
      'Office Order Book',
    ],

    issuerName: '(M. Sharat Singh)',
    issuerDesignation: 'Asst. Registrar (Finance)',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: false,
  };
}

export function createWorksBillRecoveriesOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'works-bill-recoveries',
    templateName: 'Civil Works Bill with Recoveries (SD, EMD, GST, Cess, IT)',
    layoutStyle: 'works-recoveries',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. C/',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-11-17',
    useCustomOrderDateText: false,
    customOrderDateText: 'Dated the 17th November, 2026',
    logoDataUrl: null,

    fileRefNo: 'No. MU/2(28)/2024-UE:',
    openingRefBold: true,
    openingClauseMode: 'not-exceeding',
    openingClauseConnector: 'being payment of 1st and Final bill for the work',
    sanctioningAuthorityPhrase: 'An amount of not exceeding',
    payeeSummaryOverride: 'M/S M.G Construction,',
    overallPurpose:
      '"Providing and fixing of steel grill and collapsible gate at corridor of SC Girls Hostel", Manipur University.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: '',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Particulars',
      purpose: 'Work',
      reference: 'Ref',
      grossAmount: 'Gross Payment of the Bill',
      deduction1: 'Recoveries',
      deduction2: 'Other',
      netPayment: 'Net Payment',
    },
    taxMode: 'none',
    showDeduction1: false,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 18,
    items: [],

    worksBill: {
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
    },

    delegationStyle: 'two-line-works',
    delegationAuthority: 'Vice Chancellor',
    delegationBody: 'Manipur University',
    noteSheetNo: 'Note No.57',
    noteSheetDateIso: '2026-11-16',
    accountHead: 'Capital Assets [35] - “Campus Development”',
    financialYear: '2026-27',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Vice Chancellor',
    approvalInstitution: 'Manipur University',

    showEndorsementBar: true,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, Manipur University',
      'Registrar, Manipur University.',
      'Finance Officer, Manipur University.',
      'The UE, Manipur University.',
      'M/S M.G Construction.',
      'The Relevant File.',
      'Office Order Book',
    ],

    issuerName: '(M. Sharat Singh)',
    issuerDesignation: 'Asst. Registrar (Finance)',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: true,
  };
}

export function createPgSdRefundOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'pg-sd-refund',
    templateName: 'Refund of Performance Guarantee & Security Deposit',
    layoutStyle: 'particular-amount',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. F/',
    orderTitleStyle: 'bold',
    orderDateIso: '2026-11-23',
    useCustomOrderDateText: false,
    customOrderDateText: 'Dated the 23rd November, 2026',
    logoDataUrl: null,

    fileRefNo: 'No. MU/8(19)/2023-UE-Part-B:',
    openingRefBold: false,
    openingClauseMode: 'not-exceeding',
    openingClauseConnector:
      'being Refund of Performance Guarantee and Security Deposit for the work',
    sanctioningAuthorityPhrase: 'An amount of not exceeding',
    payeeSummaryOverride: 'Th Jeevan Singh, Contractor',
    overallPurpose:
      '“P/F of distribution pipe lines from submersible pump site to Hostel and Quarters”, MU.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: '',

    columnLabels: {
      slNo: 'Sl.no.',
      party: 'Particular',
      purpose: 'Remarks',
      reference: 'Ref',
      grossAmount: 'Amount',
      deduction1: 'Deduction 1',
      deduction2: 'Deduction 2',
      netPayment: 'Net Payable',
    },
    taxMode: 'none',
    showDeduction1: false,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 0,
    items: [
      {
        id: makeId('row'),
        partyName: 'Performance Guarantee',
        purpose: '',
        referenceNo: '',
        grossAmount: 6320,
        gstRatePercent: 0,
        manualDeduction1: 0,
        manualDeduction2: 0,
        useManualDeductions: false,
      },
      {
        id: makeId('row'),
        partyName: 'Security Deposit',
        purpose: '',
        referenceNo: '',
        grossAmount: 6306,
        gstRatePercent: 0,
        manualDeduction1: 0,
        manualDeduction2: 0,
        useManualDeductions: false,
      },
    ],

    delegationStyle: 'two-line-deposit',
    delegationAuthority: 'Registrar',
    delegationBody: 'Delegation of Financial Power, MU',
    noteSheetNo: 'note no.38',
    noteSheetDateIso: '2026-11-18',
    accountHead: 'Deposit A/C 41621340855',
    financialYear: '2026-27',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Registrar',
    approvalInstitution: 'Manipur University',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, Manipur University',
      'PA to Registrar, Manipur University.',
      'Finance Officer, MU',
      'The UE, Manipur University.',
      'Th Jeevan Singh, Contractor',
      'The Relevant File.',
      'Office Order Book',
    ],

    issuerName: '(M. Sharat Singh)',
    issuerDesignation: 'Asst. Registrar (Finance)',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: true,
  };
}

export function createInterStateIgstOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'gem-igst-tds',
    templateName: 'Inter-State GeM / Vendor Supply (2% IGST TDS)',
    layoutStyle: 'vendor-table',
    updatedAt: new Date().toISOString(),

    institutionName: 'NATIONAL INSTITUTE OF TECHNOLOGY',
    institutionLocation: 'LANGOL, IMPHAL - 795004',
    orderTitle: 'SANCTION ORDER NO. NITM/FIN/2025-26/114',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-24',
    useCustomOrderDateText: false,
    customOrderDateText: '',
    logoDataUrl: null,

    fileRefNo: 'No. NITM/P&S/EQP/2025-26/084:',
    openingRefBold: true,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      'The Director is pleased to accord financial sanction for incurring an expenditure of',
    payeeSummaryOverride: 'M/s LabTech Scientific Instruments Pvt. Ltd., Kolkata',
    overallPurpose: 'Procurement of Digital Storage Oscilloscopes for ECE Laboratory through GeM.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: 'The details of payment and statutory deductions are as under:',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Name of the Firm',
      purpose: 'Item / Purpose',
      reference: 'GeM Contract / Invoice No.',
      grossAmount: 'Total Amount including GST',
      deduction1: 'Less 2% IGST',
      deduction2: 'Other Deduction',
      netPayment: 'Net Payment',
    },
    taxMode: 'gst-inclusive-tds',
    showDeduction1: true,
    showDeduction2: false,
    deduction1Rate: 2,
    deduction2Rate: 0,
    defaultGstRate: 18,
    items: [
      {
        id: makeId('row'),
        partyName: 'M/s LabTech Scientific Instruments Pvt. Ltd.',
        purpose: 'Digital Storage Oscilloscope (4-Ch, 200MHz)',
        referenceNo: 'GEMC-5116877942',
        grossAmount: 354000,
        gstRatePercent: 18,
        manualDeduction1: null,
        manualDeduction2: null,
        useManualDeductions: false,
      },
      {
        id: makeId('row'),
        partyName: 'M/s LabTech Scientific Instruments Pvt. Ltd.',
        purpose: 'Function Generator & Probe Kit',
        referenceNo: 'GEMC-5116877943',
        grossAmount: 118000,
        gstRatePercent: 18,
        manualDeduction1: null,
        manualDeduction2: null,
        useManualDeductions: false,
      },
    ],

    delegationStyle: 'combined',
    delegationAuthority: 'Director',
    delegationBody: 'the Board of Governors, NIT',
    noteSheetNo: 'Note No. 41/ECE',
    noteSheetDateIso: '2026-02-20',
    accountHead: 'OH-35 Creation of Capital Assets - Laboratory Equipment',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Director',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PS to Director for kind information',
      'Registrar & Head of Department (ECE)',
      'Deputy Registrar (Accounts & Audit)',
      'M/s LabTech Scientific Instruments Pvt. Ltd., Kolkata',
      'Guard File / Office Order Register',
    ],

    issuerName: '(R. K. Tomba Singh)',
    issuerDesignation: 'Assistant Registrar (Accounts)',
    issuerInstitution: 'National Institute of Technology',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: true,
    showDecimals: false,
  };
}

export function createEmployeeReimbursementOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'employee-reimbursement',
    templateName: 'Employee Medical / TA-DA / LTC Reimbursement',
    layoutStyle: 'vendor-table',
    updatedAt: new Date().toISOString(),

    institutionName: 'GOVERNMENT OF MANIPUR',
    institutionLocation: 'DIRECTORATE OF HIGHER & TECHNICAL EDUCATION, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. 42/2026',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-18',
    useCustomOrderDateText: false,
    customOrderDateText: '',
    logoDataUrl: null,

    fileRefNo: 'No. DHTE/ESTT/MED/2025-26/19:',
    openingRefBold: true,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      'Sanction of the Competent Authority is hereby conveyed for reimbursement of expenditure amounting to',
    payeeSummaryOverride: '',
    overallPurpose: 'Reimbursement of Medical Treatment / Official TA-DA Claims under CS (MA) Rules.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: 'The claim-wise admissible details are furnished below:',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Name & Designation',
      purpose: 'Nature of Claim & Period',
      reference: 'Emp. ID / Bill No.',
      grossAmount: 'Admissible Amount',
      deduction1: 'Less Advance Drawn',
      deduction2: 'Other Recovery',
      netPayment: 'Net Payable',
    },
    taxMode: 'flat-manual',
    showDeduction1: true,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 0,
    items: [
      {
        id: makeId('row'),
        partyName: 'Shri L. Biren Singh, Section Officer',
        purpose: 'Medical Reimbursement (Self - Jan 2026)',
        referenceNo: 'EIN-04821 / MED-14',
        grossAmount: 48650,
        gstRatePercent: 0,
        manualDeduction1: 15000,
        manualDeduction2: 0,
        useManualDeductions: true,
      },
      {
        id: makeId('row'),
        partyName: 'Smt. N. Sandhya Devi, Assistant Professor',
        purpose: 'Official Tour TA/DA (New Delhi Seminar)',
        referenceNo: 'EIN-06194 / TA-09',
        grossAmount: 29480,
        gstRatePercent: 0,
        manualDeduction1: 0,
        manualDeduction2: 0,
        useManualDeductions: true,
      },
    ],

    delegationStyle: 'combined',
    delegationAuthority: 'Director of Higher Education',
    delegationBody: 'the Finance Department under Delegation of Financial Powers Rules',
    noteSheetNo: 'File Note No. 18',
    noteSheetDateIso: '2026-02-16',
    accountHead: '2202 - General Education (03) - Medical Treatment & Domestic Travel Expenses',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Director of Higher Education',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'The Accountant General (A&E), Manipur, Imphal',
      'The Treasury Officer, Imphal West Treasury',
      'Drawing & Disbursing Officer (DDO), DHTE',
      'Officials concerned',
      'Relevant Personal File / Office Order Book',
    ],

    issuerName: '(Th. Ibemhal Chanu)',
    issuerDesignation: 'Under Secretary (Finance)',
    issuerInstitution: 'Directorate of Higher & Technical Education',

    fontFamily: 'serif',
    marginPreset: 'standard',
    showTotalInGrossColumn: true,
    showDecimals: false,
  };
}

export function createWorksAmcOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'works-amc-tds',
    templateName: 'Minor Works / AMC & Services (IT TDS + GST TDS)',
    layoutStyle: 'vendor-table',
    updatedAt: new Date().toISOString(),

    institutionName: 'CENTRAL AGRICULTURAL UNIVERSITY',
    institutionLocation: 'IROISEMBA, IMPHAL',
    orderTitle: 'SANCTION ORDER NO. CAU/ENG/2025-26/76',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-21',
    useCustomOrderDateText: false,
    customOrderDateText: '',
    logoDataUrl: null,

    fileRefNo: 'No. CAU/EE/AMC/2025-26/312:',
    openingRefBold: true,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      "The Hon'ble Vice Chancellor is pleased to accord financial sanction for payment of",
    payeeSummaryOverride: 'M/s North East Electro-Mechanical Services',
    overallPurpose: 'Annual Maintenance Contract (AMC) of DG Sets & Electrical Substation (Q3 FY 2025-26).',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: 'The bill details and statutory TDS recoveries are as follows:',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Name of Contractor / Agency',
      purpose: 'Work / Service Description',
      reference: 'Bill / MB Ref. No.',
      grossAmount: 'Gross Bill Amount',
      deduction1: 'Less IT TDS (2%)',
      deduction2: 'Less GST TDS (2%)',
      netPayment: 'Net Payment',
    },
    taxMode: 'gst-inclusive-tds',
    showDeduction1: true,
    showDeduction2: true,
    deduction1Rate: 2,
    deduction2Rate: 2,
    defaultGstRate: 18,
    items: [
      {
        id: makeId('row'),
        partyName: 'M/s North East Electro-Mechanical Services',
        purpose: 'Quarterly AMC of 250kVA DG Sets & HT Panel',
        referenceNo: 'INV/NEEMS/25-26/089',
        grossAmount: 295000,
        gstRatePercent: 18,
        manualDeduction1: null,
        manualDeduction2: null,
        useManualDeductions: false,
      },
    ],

    delegationStyle: 'combined',
    delegationAuthority: 'Vice Chancellor',
    delegationBody: 'Central Agricultural University',
    noteSheetNo: 'Note No. 52/Engg',
    noteSheetDateIso: '2026-02-19',
    accountHead: 'OH-31 General - Maintenance & Repairs of Campus Utilities',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Vice Chancellor',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, CAU Imphal',
      'Comptroller, CAU Imphal',
      'Executive Engineer, Engineering Cell',
      'M/s North East Electro-Mechanical Services',
      'Measurement Book / Office Order File',
    ],

    issuerName: '(K. Suraj Kumar)',
    issuerDesignation: 'Assistant Comptroller (Bills)',
    issuerInstitution: 'Central Agricultural University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: true,
    showDecimals: false,
  };
}

export function createDirectGrantOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'direct-grant',
    templateName: 'Direct Expenditure / Fellowship / Contingency (No TDS)',
    layoutStyle: 'vendor-table',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. G/104',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-22',
    useCustomOrderDateText: false,
    customOrderDateText: '',
    logoDataUrl: null,

    fileRefNo: 'No. MU/FIN/SCH/2025-26/44:',
    openingRefBold: true,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      "The Hon'ble Vice Chancellor is pleased to accord sanction for release of",
    payeeSummaryOverride: '',
    overallPurpose: 'Disbursement of Non-NET Research Fellowship & Departmental Seminar Contingency.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: 'The details are:',

    columnLabels: {
      slNo: 'Sl.\nNo.',
      party: 'Name of Beneficiary / Department',
      purpose: 'Particulars / Purpose',
      reference: 'Voucher / Reg. No.',
      grossAmount: 'Sanctioned Amount',
      deduction1: 'Deduction 1',
      deduction2: 'Deduction 2',
      netPayment: 'Net Payable',
    },
    taxMode: 'none',
    showDeduction1: false,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 0,
    items: [
      {
        id: makeId('row'),
        partyName: 'Dept. of Computer Science (National Seminar)',
        purpose: 'Seed Grant for Annual Symposium',
        referenceNo: 'SEM-CS/2026/01',
        grossAmount: 75000,
        gstRatePercent: 0,
        manualDeduction1: 0,
        manualDeduction2: 0,
        useManualDeductions: false,
      },
      {
        id: makeId('row'),
        partyName: 'Ph.D. Non-NET Scholars Batch (12 Scholars)',
        purpose: 'Monthly Fellowship Stipend (Feb 2026)',
        referenceNo: 'FEL/2026/02',
        grossAmount: 96000,
        gstRatePercent: 0,
        manualDeduction1: 0,
        manualDeduction2: 0,
        useManualDeductions: false,
      },
    ],

    delegationStyle: 'combined',
    delegationAuthority: 'Vice Chancellor',
    delegationBody: 'Manipur University',
    noteSheetNo: 'Note No. 14',
    noteSheetDateIso: '2026-02-20',
    accountHead: 'Recurring Grant [31] - Research Fellowships & Academic Seminars',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Vice Chancellor',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, Manipur University',
      'Registrar, Manipur University',
      'Finance Officer, MU',
      'Head, Department of Computer Science',
      'Dean, School of Mathematical & Physical Sciences',
      'Office Order Book',
    ],

    issuerName: '(M. Sharat Singh)',
    issuerDesignation: 'Asst. Registrar (Finance)',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: false,
  };
}

export function createStudentSdRefundOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'student-sd-refund',
    templateName: 'Student Security Deposit Refund (Annexure-I)',
    layoutStyle: 'lump-sum-annexure',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'OFFICE ORDER NO. C/27',
    orderTitleStyle: 'underlined',
    orderDateIso: '2026-02-19',
    useCustomOrderDateText: false,
    customOrderDateText: 'Dated the 19th February, 2026',
    logoDataUrl: null,

    fileRefNo: 'No. MU/PFMS/146/SSDR/2019-Part 2:',
    openingRefBold: false,
    boldAmountInFigure: false,
    boldAmountInWords: false,
    boldPayeeName: false,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase:
      "The Hon'ble Vice Chancellor is pleased to accord a sanction for refund of",
    payeeSummaryOverride: '738 Students',
    overallPurpose: 'refund of Security Deposit which were deposited at the time of Admission',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: '',

    columnLabels: {
      slNo: 'Sl. No.',
      party: 'Particulars',
      purpose: 'Purpose',
      reference: 'Ref',
      grossAmount: 'Amount',
      deduction1: 'Deduction 1',
      deduction2: 'Deduction 2',
      netPayment: 'Net Payable',
    },
    taxMode: 'none',
    showDeduction1: false,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 0,
    items: [],

    lumpSum: {
      amount: 672000,
      annexureNote: 'The list of students is enclosed as Annexure-I.',
    },

    delegationStyle: 'combined-account',
    delegationAuthority: 'Vice Chancellor',
    delegationBody: 'Manipur University',
    noteSheetNo: 'Note No.32',
    noteSheetDateIso: '2026-06-04',
    accountHead: 'MU Deposit Fund Account-41621340855',
    financialYear: '2026-27',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: true,
    approvalLine1: 'By order etc.,',
    approvalLine2: 'Sd/-',
    approvalAuthorityTitle: 'Vice Chancellor',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [
      'PA to Vice Chancellor, Manipur University',
      'Registrar, Manipur University.',
      'Finance Officer, MU',
      'The Relevant File.',
      'Office Order Book',
    ],

    issuerName: '(M. Sharat Singh)',
    issuerDesignation: 'Asst. Registrar (Finance)',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: false,
  };
}

export function createBankForwardingLetterOrder(): SanctionOrder {
  return {
    id: makeId('ord'),
    templateId: 'bank-forwarding-letter',
    templateName: 'Bank Forwarding Letter (Cheque & Annexure-I Credit)',
    layoutStyle: 'bank-letter',
    updatedAt: new Date().toISOString(),

    institutionName: 'MANIPUR UNIVERSITY',
    institutionLocation: 'CANCHIPUR, IMPHAL',
    orderTitle: 'Bank Cheque No. 496288',
    orderTitleStyle: 'underlined',
    orderDateIso: '2025-11-26',
    useCustomOrderDateText: false,
    customOrderDateText: '',
    logoDataUrl: null,

    fileRefNo: 'Cheque No. 496288',
    openingRefBold: true,
    boldAmountInFigure: true,
    boldAmountInWords: true,
    boldPayeeName: false,
    openingClauseMode: 'standard',
    openingClauseConnector: 'on account of',
    sanctioningAuthorityPhrase: '',
    payeeSummaryOverride: 'State Bank of India, MU Campus',
    overallPurpose: 'Crediting to individual accounts listed on Annexure-I.',
    useCustomOpeningParagraph: false,
    customOpeningParagraph: '',
    tableIntroText: '',

    columnLabels: {
      slNo: 'Sl. No.',
      party: 'Particulars',
      purpose: 'Purpose',
      reference: 'Cheque No.',
      grossAmount: 'Amount',
      deduction1: 'Deduction 1',
      deduction2: 'Deduction 2',
      netPayment: 'Net Payable',
    },
    taxMode: 'none',
    showDeduction1: false,
    showDeduction2: false,
    deduction1Rate: 0,
    deduction2Rate: 0,
    defaultGstRate: 0,
    items: [],

    bankLetter: {
      showLetterhead: false,
      recipientLine1: 'To',
      recipientLine2: 'Chief Manager',
      recipientLine3: 'State Bank of India',
      recipientLine4: 'MU Campus',
      salutation: 'Sir/Madam,',
      bodyPrefix: 'Enclose herewith is Cheque no.',
      chequeNo: '496288',
      chequeDateIso: '2025-11-26',
      chequeAmount: 310000,
      bodySuffix: 'only for crediting to the individual accounts listed on Annexure-I.',
      leftSignatoryTitle: 'Registrar',
      leftSignatoryOrg: 'Manipur University',
      rightSignatoryTitle: 'Finance Officer',
      rightSignatoryOrg: 'Manipur University',
    },

    delegationStyle: 'combined',
    delegationAuthority: 'Registrar',
    delegationBody: 'Manipur University',
    noteSheetNo: '',
    noteSheetDateIso: '2025-11-26',
    accountHead: 'MU Deposit Fund Account-41621340855',
    financialYear: '2025-26',
    useCustomDelegationParagraph: false,
    customDelegationParagraph: '',

    showApprovalBlock: false,
    approvalLine1: '',
    approvalLine2: '',
    approvalAuthorityTitle: '',
    approvalInstitution: '',

    showEndorsementBar: false,

    copyToTitle: 'Copy to:',
    copyToList: [],

    issuerName: '',
    issuerDesignation: 'Finance Officer',
    issuerInstitution: 'Manipur University',

    fontFamily: 'sans',
    marginPreset: 'standard',
    showTotalInGrossColumn: false,
    showDecimals: false,
  };
}

export const SANCTION_TEMPLATES: SanctionTemplateMeta[] = [
  {
    id: 'gem-gst-tds',
    name: 'GeM / Vendor Procurement (CGST + SGST TDS)',
    category: 'Intra-State Purchase',
    description:
      'Office Order No. C format for GeM/vendor supply bills with automatic 1% CGST + 1% SGST TDS calculated on GST-exclusive taxable value (Section 51 CGST Act).',
    taxSummary: '1% CGST + 1% SGST on taxable value (default 18% GST)',
    columnsSummary: '8 columns · Firm · Purpose · GeM Invoice · Gross · CGST · SGST · Net',
    createOrder: createManipurGemOrder,
  },
  {
    id: 'works-bill-recoveries',
    name: 'Civil Works Bill with Statutory Recoveries',
    category: 'Engineering & Works',
    description:
      'Office Order No. C works-bill statement (1st & Final / RA Bill) with automatic Work Value extraction, 5% SD less EMD, 1% CGST, 1% SGST, 1% Labour Cess, 2% IT, Net Payment in words, and endorsement memo bar.',
    taxSummary: '5% SD (-EMD) + 1% CGST + 1% SGST + 1% Labour Cess + 2% IT',
    columnsSummary: 'Works Recovery Sheet · Gross · Work Value · Itemized Recoveries · Net Payment',
    createOrder: createWorksBillRecoveriesOrder,
  },
  {
    id: 'pg-sd-refund',
    name: 'Refund of Performance Guarantee & Security Deposit',
    category: 'Deposit Refund',
    description:
      'Office Order No. F format for releasing Contractor Performance Guarantee (PG) and Security Deposit (SD) from University Deposit A/C with Registrar approval under Delegation of Financial Power.',
    taxSummary: 'Zero tax deductions · Direct Deposit A/C refund',
    columnsSummary: '3 columns · Sl.no. · Particular · Amount (₹ with .00)',
    createOrder: createPgSdRefundOrder,
  },
  {
    id: 'student-sd-refund',
    name: 'Student Security Deposit Refund (Annexure-I)',
    category: 'Student Refund',
    description:
      'Office Order No. C format for bulk student admission security deposit refunds referencing Annexure-I list of students, debitable to MU Deposit Fund Account.',
    taxSummary: 'Zero tax deductions · Lump-sum refund with Annexure-I',
    columnsSummary: 'Narrative Office Order · Auto Indian Words · Deposit Fund Account',
    createOrder: createStudentSdRefundOrder,
  },
  {
    id: 'bank-forwarding-letter',
    name: 'Bank Forwarding Letter (Cheque & Annexure Credit)',
    category: 'Bank Format',
    description:
      'Official bank covering letter addressed to Chief Manager, State Bank of India (MU Campus) enclosing cheque number, date, and amount for crediting to individual accounts in Annexure-I with dual Registrar & Finance Officer signatures.',
    taxSummary: 'Cheque amount auto-converted to Indian words',
    columnsSummary: 'Bank Letter · Recipient · Cheque Details · Joint Signatories',
    createOrder: createBankForwardingLetterOrder,
  },
  {
    id: 'gem-igst-tds',
    name: 'Inter-State GeM / Vendor Supply (2% IGST TDS)',
    category: 'Inter-State Purchase',
    description:
      'For out-of-state suppliers and GeM contracts where 2% IGST TDS is deducted on the taxable base value instead of split CGST/SGST.',
    taxSummary: '2% IGST on taxable value (default 18% GST)',
    columnsSummary: '7 columns · Firm · Item · GeM Contract · Gross · 2% IGST · Net',
    createOrder: createInterStateIgstOrder,
  },
  {
    id: 'employee-reimbursement',
    name: 'Employee Medical / TA-DA / LTC Reimbursement',
    category: 'Establishment & HR',
    description:
      'Official sanction order for reimbursing government employee medical treatment, tour TA/DA, or LTC claims with advance adjustment recovery.',
    taxSummary: 'Manual advance / recovery deduction per employee',
    columnsSummary: '7 columns · Name & Desig. · Claim · Emp ID · Admissible · Advance · Net',
    createOrder: createEmployeeReimbursementOrder,
  },
  {
    id: 'works-amc-tds',
    name: 'Minor Works / AMC & Services (IT + GST TDS)',
    category: 'Works & Maintenance',
    description:
      'Designed for estate divisions, PWD, and campus AMC contracts requiring simultaneous Income Tax TDS (u/s 194C/194J) and GST TDS deductions.',
    taxSummary: '2% IT TDS + 2% GST TDS on base value',
    columnsSummary: '8 columns · Contractor · Service · Bill Ref · Gross · IT TDS · GST TDS · Net',
    createOrder: createWorksAmcOrder,
  },
  {
    id: 'direct-grant',
    name: 'Direct Expenditure / Fellowship / Contingency',
    category: 'Grants & Stipends',
    description:
      'Clean 5-column sanction order for scholarships, non-NET fellowships, departmental seminars, and office contingency with zero tax deduction columns.',
    taxSummary: 'No statutory tax deductions',
    columnsSummary: '5 columns · Sl. No. · Beneficiary · Particulars · Voucher · Amount',
    createOrder: createDirectGrantOrder,
  },
];

export function createOrderByTemplateId(templateId: TemplateId): SanctionOrder {
  const found = SANCTION_TEMPLATES.find((t) => t.id === templateId);
  return found ? found.createOrder() : createManipurGemOrder();
}

export const COMMON_COPY_TO_PRESETS: string[] = [
  'PA to Vice Chancellor, Manipur University',
  'PA to Registrar, Manipur University.',
  'Registrar, Manipur University.',
  'Finance Officer, Manipur University.',
  'The UE, Manipur University.',
  'Internal Audit Officer',
  'Drawing & Disbursing Officer (DDO)',
  'The Relevant File.',
  'Office Order Book',
];

export const COMMON_ACCOUNT_HEADS: string[] = [
  'Capital Assets [35] - “Other Infrastructure including Furniture and Fixture',
  'Capital Assets [35] - “Campus Development”',
  'MU Deposit Fund Account-41621340855',
  'Deposit A/C 41621340855',
  'OH-35 Creation of Capital Assets - Laboratory & IT Equipment',
  'OH-31 General - Office Expenses & Contingency',
  'OH-31 General - Maintenance & Repairs',
  '2202 - General Education - Medical Treatment & Travel Expenses',
  'Recurring Grant [31] - Research Fellowships & Academic Seminars',
];
