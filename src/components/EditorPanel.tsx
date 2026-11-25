import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImagePlus,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import type { SanctionLineItem, SanctionOrder, TaxCalculationMode } from '../types/sanction';
import { COMMON_ACCOUNT_HEADS, COMMON_COPY_TO_PRESETS } from '../data/templates';
import {
  computeOrderTotals,
  formatIndianNumber,
  formatRupeeSymbol,
  incrementTrailingNumber,
} from '../utils/indianFormat';
import { WorksBillEditorSection } from './WorksBillEditorSection';
import { BankLetterEditorSection } from './BankLetterEditorSection';

type EditorTab = 'header' | 'items' | 'account' | 'signatories';

interface EditorPanelProps {
  order: SanctionOrder;
  onChange: (updated: SanctionOrder) => void;
  onResetCurrentTemplate: () => void;
}

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'header', label: '1. Header' },
  { id: 'items', label: '2. Items & Tax' },
  { id: 'account', label: '3. Account Head' },
  { id: 'signatories', label: '4. Sign & Copy' },
];

const inputClass =
  'w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-colors placeholder:text-slate-400';

const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

export const EditorPanel: React.FC<EditorPanelProps> = ({
  order,
  onChange,
  onResetCurrentTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('header');
  const [newCopyRecipient, setNewCopyRecipient] = useState('');
  const [showColumnLabelConfig, setShowColumnLabelConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totals = computeOrderTotals(order);

  const updateField = <K extends keyof SanctionOrder>(field: K, value: SanctionOrder[K]) => {
    onChange({
      ...order,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateLineItem = (rowId: string, patch: Partial<SanctionLineItem>) => {
    const nextItems = order.items.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    updateField('items', nextItems);
  };

  const addLineItem = () => {
    const lastRow = order.items[order.items.length - 1];
    const newRow: SanctionLineItem = {
      id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      partyName: lastRow ? lastRow.partyName : '',
      purpose: '',
      referenceNo: '',
      grossAmount: 0,
      gstRatePercent: order.defaultGstRate,
      manualDeduction1: 0,
      manualDeduction2: 0,
      useManualDeductions: order.taxMode === 'flat-manual',
    };
    updateField('items', [...order.items, newRow]);
  };

  const duplicateLineItem = (row: SanctionLineItem) => {
    const copy: SanctionLineItem = {
      ...row,
      id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      referenceNo: incrementTrailingNumber(row.referenceNo),
    };
    updateField('items', [...order.items, copy]);
  };

  const removeLineItem = (rowId: string) => {
    updateField(
      'items',
      order.items.filter((row) => row.id !== rowId)
    );
  };

  const handleTaxModeChange = (mode: TaxCalculationMode) => {
    const updated: SanctionOrder = {
      ...order,
      taxMode: mode,
      showDeduction1: mode === 'none' ? false : order.showDeduction1 || true,
      showDeduction2: mode === 'none' ? false : order.showDeduction2,
      updatedAt: new Date().toISOString(),
    };
    onChange(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('logoDataUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addCopyEntry = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    updateField('copyToList', [...order.copyToList, cleaned]);
    setNewCopyRecipient('');
  };

  const updateCopyEntry = (idx: number, value: string) => {
    const next = [...order.copyToList];
    next[idx] = value;
    updateField('copyToList', next);
  };

  const moveCopyEntry = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= order.copyToList.length) return;
    const next = [...order.copyToList];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateField('copyToList', next);
  };

  const removeCopyEntry = (idx: number) => {
    updateField(
      'copyToList',
      order.copyToList.filter((_, i) => i !== idx)
    );
  };

  const activeTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const goPrevTab = () => {
    if (activeTabIndex > 0) setActiveTab(TABS[activeTabIndex - 1].id);
  };
  const goNextTab = () => {
    if (activeTabIndex < TABS.length - 1) setActiveTab(TABS[activeTabIndex + 1].id);
  };

  if (order.layoutStyle === 'bank-letter') {
    return (
      <aside className="flex flex-col h-full bg-white border-r border-slate-200">
        <div className="px-5 pt-4 pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                Bank Letter Details
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">{order.templateName}</p>
            </div>
            <button
              type="button"
              onClick={onResetCurrentTemplate}
              title="Reset fields to default template sample"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto workspace-scroll px-5 py-5">
          <BankLetterEditorSection order={order} onChange={onChange} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Editor Header + Section Segmented Control */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate">Order Details</h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">{order.templateName}</p>
          </div>
          <button
            type="button"
            onClick={onResetCurrentTemplate}
            title="Reset fields to default template sample"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const displayLabel =
              tab.id === 'items' && order.layoutStyle === 'lump-sum-annexure'
                ? '2. Refund Amt'
                : tab.label;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                  isActive
                    ? 'bg-white text-[#1E3A5F] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Active Form Section */}
      <div className="flex-1 overflow-y-auto workspace-scroll px-5 py-5 space-y-5">
        {activeTab === 'header' && (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="institutionName" className={labelClass}>
                  Institution / Ministry / Department Name
                </label>
                <input
                  id="institutionName"
                  type="text"
                  value={order.institutionName}
                  onChange={(e) => updateField('institutionName', e.target.value)}
                  placeholder="e.g. MANIPUR UNIVERSITY"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="institutionLocation" className={labelClass}>
                  Campus / Office Location
                </label>
                <input
                  id="institutionLocation"
                  type="text"
                  value={order.institutionLocation}
                  onChange={(e) => updateField('institutionLocation', e.target.value)}
                  placeholder="e.g. CANCHIPUR, IMPHAL"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="orderTitle" className="text-xs font-semibold text-slate-700">
                      Office / Sanction Order No.
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('orderTitle', incrementTrailingNumber(order.orderTitle))
                      }
                      className="text-[11px] font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
                    >
                      +1 Next No.
                    </button>
                  </div>
                  <input
                    id="orderTitle"
                    type="text"
                    value={order.orderTitle}
                    onChange={(e) => updateField('orderTitle', e.target.value)}
                    placeholder="OFFICE ORDER NO. C/28"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="orderDateIso" className={labelClass}>
                    Order Date
                  </label>
                  <input
                    id="orderDateIso"
                    type="date"
                    value={order.orderDateIso}
                    onChange={(e) => updateField('orderDateIso', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={order.useCustomOrderDateText}
                    onChange={(e) => updateField('useCustomOrderDateText', e.target.checked)}
                    className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                  Override formatted date line manually
                </label>
              </div>

              {order.useCustomOrderDateText && (
                <div>
                  <label htmlFor="customOrderDateText" className={labelClass}>
                    Custom Date Line
                  </label>
                  <input
                    id="customOrderDateText"
                    type="text"
                    value={order.customOrderDateText}
                    onChange={(e) => updateField('customOrderDateText', e.target.value)}
                    placeholder="Dated the 19th February, 2026"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Optional Emblem Upload */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Institution Emblem / Logo (Optional)
                    </span>
                    <span className="text-xs text-slate-500">
                      Printed centered above the heading
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {order.logoDataUrl ? (
                      <button
                        type="button"
                        onClick={() => updateField('logoDataUrl', null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        Upload Emblem
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Sanction Clause */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h3 className="text-xs font-semibold text-slate-900">Opening Sanction Clause</h3>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="fileRefNo" className="text-xs font-semibold text-slate-700">
                    File / Memo Reference No.
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateField('fileRefNo', incrementTrailingNumber(order.fileRefNo))
                    }
                    className="text-[11px] font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
                  >
                    +1 Next Ref
                  </button>
                </div>
                <input
                  id="fileRefNo"
                  type="text"
                  value={order.fileRefNo}
                  onChange={(e) => updateField('fileRefNo', e.target.value)}
                  placeholder="No. MU/AP/MU/MUSU 2025-26/CM-01:"
                  className={inputClass}
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.useCustomOpeningParagraph}
                  onChange={(e) => updateField('useCustomOpeningParagraph', e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                />
                Write custom opening paragraph text instead of auto-syncing amount & payee
              </label>

              {order.useCustomOpeningParagraph ? (
                <div>
                  <label htmlFor="customOpeningParagraph" className={labelClass}>
                    Custom Opening Paragraph Body
                  </label>
                  <textarea
                    id="customOpeningParagraph"
                    rows={4}
                    value={order.customOpeningParagraph}
                    onChange={(e) => updateField('customOpeningParagraph', e.target.value)}
                    placeholder="Enter exact formal sanction wording..."
                    className={inputClass}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="sanctioningAuthorityPhrase" className={labelClass}>
                      Sanctioning Authority Phrase
                    </label>
                    <input
                      id="sanctioningAuthorityPhrase"
                      type="text"
                      value={order.sanctioningAuthorityPhrase}
                      onChange={(e) => updateField('sanctioningAuthorityPhrase', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="payeeSummaryOverride" className={labelClass}>
                        Payee Name in Clause (Optional)
                      </label>
                      <input
                        id="payeeSummaryOverride"
                        type="text"
                        value={order.payeeSummaryOverride}
                        onChange={(e) => updateField('payeeSummaryOverride', e.target.value)}
                        placeholder="Auto-fills from item table"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="overallPurpose" className={labelClass}>
                        On Account Of (Purpose)
                      </label>
                      <input
                        id="overallPurpose"
                        type="text"
                        value={order.overallPurpose}
                        onChange={(e) => updateField('overallPurpose', e.target.value)}
                        placeholder="Supply of Computers."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <span className="block text-[11px] font-semibold text-slate-700">
                      Bold Formatting in First Paragraph
                    </span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            order.boldPayeeName ?? false
                          }
                          onChange={(e) => updateField('boldPayeeName', e.target.checked)}
                          className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                        />
                        Payee Name
                      </label>

                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            order.boldAmountInFigure ??
                            (order.layoutStyle ?? 'vendor-table') !== 'particular-amount'
                          }
                          onChange={(e) => updateField('boldAmountInFigure', e.target.checked)}
                          className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                        />
                        Amount in Figure
                      </label>

                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={order.boldAmountInWords ?? false}
                          onChange={(e) => updateField('boldAmountInWords', e.target.checked)}
                          className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                        />
                        Amount in Words
                      </label>
                    </div>
                  </div>
                </>
              )}

              {order.layoutStyle !== 'lump-sum-annexure' && (
                <div>
                  <label htmlFor="tableIntroText" className={labelClass}>
                    Table Lead-in Line
                  </label>
                  <input
                    id="tableIntroText"
                    type="text"
                    value={order.tableIntroText}
                    onChange={(e) => updateField('tableIntroText', e.target.value)}
                    placeholder="The details are:"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'items' && order.layoutStyle === 'lump-sum-annexure' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Total Sanctioned Refund</span>
                <span className="text-sm font-semibold text-[#1E3A5F] font-mono tabular-nums">
                  {formatRupeeSymbol(totals.totalGross, Boolean(order.showDecimals))}
                </span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">In Words: </span>
                {totals.grossInWords} only
              </div>
            </div>

            <div>
              <label htmlFor="lumpSumAmount" className={labelClass}>
                Total Refund Amount (₹)
              </label>
              <input
                id="lumpSumAmount"
                type="number"
                min="0"
                step="1"
                value={order.lumpSum?.amount || ''}
                onChange={(e) =>
                  updateField('lumpSum', {
                    amount: parseFloat(e.target.value) || 0,
                    annexureNote:
                      order.lumpSum?.annexureNote ??
                      'The list of students is enclosed as Annexure-I.',
                  })
                }
                placeholder="672000"
                className={`${inputClass} font-mono tabular-nums text-right`}
              />
            </div>

            <div>
              <label htmlFor="lumpSumPayee" className={labelClass}>
                Beneficiaries / Student Count
              </label>
              <input
                id="lumpSumPayee"
                type="text"
                value={order.payeeSummaryOverride}
                onChange={(e) => updateField('payeeSummaryOverride', e.target.value)}
                placeholder="738 Students"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="lumpSumAnnexureNote" className={labelClass}>
                Annexure Enclosure Sentence
              </label>
              <textarea
                id="lumpSumAnnexureNote"
                rows={3}
                value={order.lumpSum?.annexureNote ?? ''}
                onChange={(e) =>
                  updateField('lumpSum', {
                    amount: order.lumpSum?.amount ?? 0,
                    annexureNote: e.target.value,
                  })
                }
                placeholder="The list of students is enclosed as Annexure-I."
                className={inputClass}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Appended directly at the end of the opening sanction paragraph (no inline table).
              </p>
            </div>
          </div>
        )}

        {activeTab === 'items' && order.layoutStyle === 'works-recoveries' && (
          <WorksBillEditorSection order={order} onChange={onChange} />
        )}

        {activeTab === 'items' && order.layoutStyle === 'particular-amount' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Total Refund Amount</span>
                <span className="text-sm font-semibold text-[#1E3A5F] font-mono tabular-nums">
                  {formatRupeeSymbol(totals.totalGross, Boolean(order.showDecimals))}
                </span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">In Words: </span>
                {totals.grossInWords} only
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                Particulars & Amounts ({order.items.length})
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Particular
              </button>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {order.items.map((row, idx) => (
                <div key={row.id} className="p-3 flex items-end gap-2">
                  <span className="w-5 pb-2 text-xs font-mono text-slate-500 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {order.columnLabels.party}
                    </label>
                    <input
                      type="text"
                      value={row.partyName}
                      onChange={(e) => updateLineItem(row.id, { partyName: e.target.value })}
                      placeholder="Performance Guarantee"
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                  <div className="w-32 shrink-0">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.grossAmount || ''}
                      onChange={(e) =>
                        updateLineItem(row.id, { grossAmount: parseFloat(e.target.value) || 0 })
                      }
                      className={`${inputClass} !py-1.5 text-xs font-mono tabular-nums text-right`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(row.id)}
                    title="Delete row"
                    className="p-1.5 mb-0.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (order.layoutStyle ?? 'vendor-table') === 'vendor-table' && (
          <>
            {/* Live Computed Totals Strip */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">Gross Sanctioned</div>
                  <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatRupeeSymbol(totals.totalGross)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Total Deductions</div>
                  <div className="text-sm font-semibold text-slate-700 font-mono tabular-nums mt-0.5">
                    {formatRupeeSymbol(totals.totalDeduction1 + totals.totalDeduction2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Net Payment</div>
                  <div className="text-sm font-semibold text-[#1E3A5F] font-mono tabular-nums mt-0.5">
                    {formatRupeeSymbol(totals.totalNet)}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">In Words: </span>
                {totals.grossInWords} only
              </div>
            </div>

            {/* Tax & Deduction Calculation Rules */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">Tax & TDS Calculation Mode</h3>
                <button
                  type="button"
                  onClick={() => setShowColumnLabelConfig((v) => !v)}
                  className="text-xs font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
                >
                  {showColumnLabelConfig ? 'Hide Column Headings' : 'Edit Column Headings'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'gst-inclusive-tds', label: 'GST TDS (Sec 51)' },
                    { id: 'direct-gross-percent', label: 'Direct % on Gross' },
                    { id: 'flat-manual', label: 'Manual Deductions' },
                    { id: 'none', label: 'No Deductions' },
                  ] as { id: TaxCalculationMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleTaxModeChange(mode.id)}
                    className={`px-2.5 py-2 text-xs font-medium rounded-md border transition-colors text-left truncate ${
                      order.taxMode === mode.id
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {order.taxMode !== 'none' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={order.showDeduction1}
                        onChange={(e) => updateField('showDeduction1', e.target.checked)}
                        className="rounded border-slate-300 text-[#1E3A5F]"
                      />
                      Deduction Column 1
                    </label>
                    {order.showDeduction1 && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={order.columnLabels.deduction1}
                          onChange={(e) =>
                            updateField('columnLabels', {
                              ...order.columnLabels,
                              deduction1: e.target.value,
                            })
                          }
                          aria-label="Deduction 1 label"
                          className={`${inputClass} !py-1.5 text-xs`}
                        />
                        {order.taxMode !== 'flat-manual' && (
                          <div className="flex items-center shrink-0">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="30"
                              value={order.deduction1Rate}
                              onChange={(e) =>
                                updateField('deduction1Rate', parseFloat(e.target.value) || 0)
                              }
                              aria-label="Deduction 1 rate percent"
                              className="w-14 px-2 py-1.5 text-xs font-mono tabular-nums text-right border border-slate-300 rounded-md focus:outline-none focus:border-[#1E3A5F]"
                            />
                            <span className="text-xs text-slate-500 ml-1">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={order.showDeduction2}
                        onChange={(e) => updateField('showDeduction2', e.target.checked)}
                        className="rounded border-slate-300 text-[#1E3A5F]"
                      />
                      Deduction Column 2
                    </label>
                    {order.showDeduction2 && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={order.columnLabels.deduction2}
                          onChange={(e) =>
                            updateField('columnLabels', {
                              ...order.columnLabels,
                              deduction2: e.target.value,
                            })
                          }
                          aria-label="Deduction 2 label"
                          className={`${inputClass} !py-1.5 text-xs`}
                        />
                        {order.taxMode !== 'flat-manual' && (
                          <div className="flex items-center shrink-0">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="30"
                              value={order.deduction2Rate}
                              onChange={(e) =>
                                updateField('deduction2Rate', parseFloat(e.target.value) || 0)
                              }
                              aria-label="Deduction 2 rate percent"
                              className="w-14 px-2 py-1.5 text-xs font-mono tabular-nums text-right border border-slate-300 rounded-md focus:outline-none focus:border-[#1E3A5F]"
                            />
                            <span className="text-xs text-slate-500 ml-1">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={order.showTotalInGrossColumn}
                  onChange={(e) => updateField('showTotalInGrossColumn', e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
                Display column totals for Gross & Deduction columns in Total row
              </label>

              {showColumnLabelConfig && (
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Party / Payee Column
                    </label>
                    <input
                      type="text"
                      value={order.columnLabels.party}
                      onChange={(e) =>
                        updateField('columnLabels', { ...order.columnLabels, party: e.target.value })
                      }
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Purpose Column
                    </label>
                    <input
                      type="text"
                      value={order.columnLabels.purpose}
                      onChange={(e) =>
                        updateField('columnLabels', {
                          ...order.columnLabels,
                          purpose: e.target.value,
                        })
                      }
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Invoice / Ref Column
                    </label>
                    <input
                      type="text"
                      value={order.columnLabels.reference}
                      onChange={(e) =>
                        updateField('columnLabels', {
                          ...order.columnLabels,
                          reference: e.target.value,
                        })
                      }
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Gross Amount Column
                    </label>
                    <input
                      type="text"
                      value={order.columnLabels.grossAmount}
                      onChange={(e) =>
                        updateField('columnLabels', {
                          ...order.columnLabels,
                          grossAmount: e.target.value,
                        })
                      }
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Net Payment Column
                    </label>
                    <input
                      type="text"
                      value={order.columnLabels.netPayment}
                      onChange={(e) =>
                        updateField('columnLabels', {
                          ...order.columnLabels,
                          netPayment: e.target.value,
                        })
                      }
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">
                  Sanction Line Items ({order.items.length})
                </h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              {order.items.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg">
                  <p className="text-sm text-slate-600 mb-3">
                    No firms or beneficiary items added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] rounded-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {order.items.map((row, idx) => {
                    const computed = totals.rows[idx];
                    return (
                      <div key={row.id} className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            Item #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateLineItem(row)}
                              title="Duplicate row"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLineItem(row.id)}
                              title="Delete row"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              {order.columnLabels.party}
                            </label>
                            <input
                              type="text"
                              value={row.partyName}
                              onChange={(e) =>
                                updateLineItem(row.id, { partyName: e.target.value })
                              }
                              placeholder="M/S Khushi Computer"
                              className={`${inputClass} !py-1.5 text-xs`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              {order.columnLabels.purpose}
                            </label>
                            <input
                              type="text"
                              value={row.purpose}
                              onChange={(e) => updateLineItem(row.id, { purpose: e.target.value })}
                              placeholder="Desktop Computer"
                              className={`${inputClass} !py-1.5 text-xs`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              {order.columnLabels.reference}
                            </label>
                            <input
                              type="text"
                              value={row.referenceNo}
                              onChange={(e) =>
                                updateLineItem(row.id, { referenceNo: e.target.value })
                              }
                              placeholder="GEM-69891635"
                              className={`${inputClass} !py-1.5 text-xs font-mono`}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Gross Amount (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.grossAmount || ''}
                              onChange={(e) =>
                                updateLineItem(row.id, {
                                  grossAmount: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="414179"
                              className={`${inputClass} !py-1.5 text-xs font-mono tabular-nums text-right`}
                            />
                          </div>

                          {order.taxMode === 'gst-inclusive-tds' && (
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Invoice GST Slab
                              </label>
                              <select
                                value={row.gstRatePercent}
                                onChange={(e) =>
                                  updateLineItem(row.id, {
                                    gstRatePercent: parseFloat(e.target.value),
                                  })
                                }
                                className={`${inputClass} !py-1.5 text-xs`}
                              >
                                <option value={18}>18% GST</option>
                                <option value={12}>12% GST</option>
                                <option value={5}>5% GST</option>
                                <option value={28}>28% GST</option>
                                <option value={0}>0% (No GST)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {order.taxMode !== 'none' && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                              <span className="font-mono tabular-nums">
                                {order.taxMode === 'gst-inclusive-tds' && (
                                  <>
                                    Base ₹{formatIndianNumber(computed.taxableValue)} ·{' '}
                                  </>
                                )}
                                Net{' '}
                                <strong className="text-slate-900">
                                  {formatRupeeSymbol(computed.netPayment)}
                                </strong>
                              </span>

                              {order.taxMode !== 'flat-manual' && (
                                <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.useManualDeductions}
                                    onChange={(e) =>
                                      updateLineItem(row.id, {
                                        useManualDeductions: e.target.checked,
                                        manualDeduction1:
                                          row.manualDeduction1 ?? computed.deduction1,
                                        manualDeduction2:
                                          row.manualDeduction2 ?? computed.deduction2,
                                      })
                                    }
                                    className="rounded border-slate-300 text-[#1E3A5F]"
                                  />
                                  Override TDS manually
                                </label>
                              )}
                            </div>

                            {(row.useManualDeductions || order.taxMode === 'flat-manual') && (
                              <div className="grid grid-cols-2 gap-2.5">
                                {order.showDeduction1 && (
                                  <div>
                                    <label className="block text-[11px] text-slate-600 mb-1">
                                      {order.columnLabels.deduction1} (₹)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.manualDeduction1 ?? 0}
                                      onChange={(e) =>
                                        updateLineItem(row.id, {
                                          manualDeduction1: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className={`${inputClass} !py-1.5 text-xs font-mono tabular-nums text-right`}
                                    />
                                  </div>
                                )}
                                {order.showDeduction2 && (
                                  <div>
                                    <label className="block text-[11px] text-slate-600 mb-1">
                                      {order.columnLabels.deduction2} (₹)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.manualDeduction2 ?? 0}
                                      onChange={(e) =>
                                        updateLineItem(row.id, {
                                          manualDeduction2: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className={`${inputClass} !py-1.5 text-xs font-mono tabular-nums text-right`}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={order.useCustomDelegationParagraph}
                onChange={(e) => updateField('useCustomDelegationParagraph', e.target.checked)}
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Edit full delegation & budget head paragraph manually
            </label>

            {order.useCustomDelegationParagraph ? (
              <div>
                <label htmlFor="customDelegationParagraph" className={labelClass}>
                  Custom Delegation & Account Head Clause
                </label>
                <textarea
                  id="customDelegationParagraph"
                  rows={5}
                  value={order.customDelegationParagraph}
                  onChange={(e) => updateField('customDelegationParagraph', e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <>
                {(order.delegationStyle === 'two-line-works' ||
                  order.delegationStyle === 'two-line-deposit') && (
                  <div>
                    <label htmlFor="delegationAuthority" className={labelClass}>
                      Sanctioned / Approved By
                    </label>
                    <input
                      id="delegationAuthority"
                      type="text"
                      value={order.delegationAuthority ?? ''}
                      onChange={(e) => updateField('delegationAuthority', e.target.value)}
                      placeholder="Vice Chancellor / Registrar"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="delegationBody" className={labelClass}>
                    Powers Delegated By (Institution / Rule)
                  </label>
                  <input
                    id="delegationBody"
                    type="text"
                    value={order.delegationBody}
                    onChange={(e) => updateField('delegationBody', e.target.value)}
                    placeholder="Manipur University"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="noteSheetNo" className={labelClass}>
                      Approval Note Sheet No.
                    </label>
                    <input
                      id="noteSheetNo"
                      type="text"
                      value={order.noteSheetNo}
                      onChange={(e) => updateField('noteSheetNo', e.target.value)}
                      placeholder="Note No.26"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="noteSheetDateIso" className={labelClass}>
                      Note Sheet Date
                    </label>
                    <input
                      id="noteSheetDateIso"
                      type="date"
                      value={order.noteSheetDateIso}
                      onChange={(e) => updateField('noteSheetDateIso', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="accountHead" className={labelClass}>
                    Head of Account (Bolded in Output)
                  </label>
                  <textarea
                    id="accountHead"
                    rows={2}
                    value={order.accountHead}
                    onChange={(e) => updateField('accountHead', e.target.value)}
                    placeholder='Capital Assets [35] - "Other Infrastructure including Furniture and Fixture"'
                    className={inputClass}
                  />
                  <div className="mt-2">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Quick-fill common Budget Head
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) updateField('accountHead', e.target.value);
                      }}
                      className={`${inputClass} !py-1.5 text-xs text-slate-600`}
                    >
                      <option value="">Select a preset Head of Account...</option>
                      {COMMON_ACCOUNT_HEADS.map((head) => (
                        <option key={head} value={head}>
                          {head}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="financialYear" className={labelClass}>
                    Financial Year
                  </label>
                  <input
                    id="financialYear"
                    type="text"
                    value={order.financialYear}
                    onChange={(e) => updateField('financialYear', e.target.value)}
                    placeholder="2025-26"
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'signatories' && (
          <div className="space-y-5">
            {/* Middle Right Approval Sign-Off */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">
                  Sanctioning Authority Sign-Off
                </h3>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={order.showApprovalBlock}
                    onChange={(e) => updateField('showApprovalBlock', e.target.checked)}
                    className="rounded border-slate-300 text-[#1E3A5F]"
                  />
                  Include
                </label>
              </div>

              {order.showApprovalBlock && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Line 1
                      </label>
                      <input
                        type="text"
                        value={order.approvalLine1}
                        onChange={(e) => updateField('approvalLine1', e.target.value)}
                        placeholder="By order etc.,"
                        className={`${inputClass} !py-1.5 text-xs`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Signature Mark
                      </label>
                      <input
                        type="text"
                        value={order.approvalLine2}
                        onChange={(e) => updateField('approvalLine2', e.target.value)}
                        placeholder="Sd/-"
                        className={`${inputClass} !py-1.5 text-xs`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Authority Title
                      </label>
                      <input
                        type="text"
                        value={order.approvalAuthorityTitle}
                        onChange={(e) => updateField('approvalAuthorityTitle', e.target.value)}
                        placeholder="Vice Chancellor"
                        className={`${inputClass} !py-1.5 text-xs`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Authority Institution (Optional 4th line)
                      </label>
                      <input
                        type="text"
                        value={order.approvalInstitution ?? ''}
                        onChange={(e) => updateField('approvalInstitution', e.target.value)}
                        placeholder="Manipur University"
                        className={`${inputClass} !py-1.5 text-xs`}
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-4">
                      <input
                        type="checkbox"
                        checked={Boolean(order.showEndorsementBar)}
                        onChange={(e) => updateField('showEndorsementBar', e.target.checked)}
                        className="rounded border-slate-300 text-[#1E3A5F]"
                      />
                      Show Memo No. & Date bar above Copy to
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom-Right Issuing Officer */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-900">
                Issuing Officer Signature Block
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label htmlFor="issuerName" className={labelClass}>
                    Officer Name
                  </label>
                  <input
                    id="issuerName"
                    type="text"
                    value={order.issuerName}
                    onChange={(e) => updateField('issuerName', e.target.value)}
                    placeholder="(M. Sharat Singh)"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="issuerDesignation" className={labelClass}>
                      Designation
                    </label>
                    <input
                      id="issuerDesignation"
                      type="text"
                      value={order.issuerDesignation}
                      onChange={(e) => updateField('issuerDesignation', e.target.value)}
                      placeholder="Asst. Registrar (Finance)"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="issuerInstitution" className={labelClass}>
                      Institution / Office
                    </label>
                    <input
                      id="issuerInstitution"
                      type="text"
                      value={order.issuerInstitution}
                      onChange={(e) => updateField('issuerInstitution', e.target.value)}
                      placeholder="Manipur University"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Copy To Distribution List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  Distribution List ({order.copyToList.length})
                </h3>
                {order.items[0]?.partyName && (
                  <button
                    type="button"
                    onClick={() => addCopyEntry(`${order.items[0].partyName},`)}
                    className="text-xs font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
                  >
                    + Add Primary Firm
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {order.copyToList.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-5 text-xs font-mono text-slate-500 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={entry}
                      onChange={(e) => updateCopyEntry(idx, e.target.value)}
                      className={`${inputClass} !py-1.5 text-xs`}
                    />
                    <button
                      type="button"
                      onClick={() => moveCopyEntry(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCopyEntry(idx, 1)}
                      disabled={idx === order.copyToList.length - 1}
                      title="Move down"
                      className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCopyEntry(idx)}
                      title="Remove recipient"
                      className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newCopyRecipient}
                  onChange={(e) => setNewCopyRecipient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCopyEntry(newCopyRecipient);
                    }
                  }}
                  placeholder="Add recipient (e.g. Internal Audit Officer)"
                  className={`${inputClass} !py-1.5 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => addCopyEntry(newCopyRecipient)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Quick-insert Standard Recipient
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addCopyEntry(e.target.value);
                  }}
                  className={`${inputClass} !py-1.5 text-xs text-slate-600`}
                >
                  <option value="">Select standard office recipient...</option>
                  {COMMON_COPY_TO_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Step Navigation */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={goPrevTab}
          disabled={activeTabIndex === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <span className="text-xs text-slate-500 tabular-nums">
          Step {activeTabIndex + 1} of {TABS.length}
        </span>

        <button
          type="button"
          onClick={goNextTab}
          disabled={activeTabIndex === TABS.length - 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
