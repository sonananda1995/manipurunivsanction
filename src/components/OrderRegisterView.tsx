import React, { useMemo, useRef, useState } from 'react';
import { CopyPlus, Download, FileDown, FolderOpen, Search, Trash2, Upload } from 'lucide-react';
import type { SanctionOrder, TemplateId } from '../types/sanction';
import {
  computeOrderTotals,
  formatRupeeSymbol,
  formatSlashDate,
  getResolvedPayeeText,
} from '../utils/indianFormat';

interface OrderRegisterViewProps {
  savedOrders: SanctionOrder[];
  currentOrderId: string;
  onPreviewOrder: (order: SanctionOrder) => void;
  onOpenOrder: (order: SanctionOrder) => void;
  onDuplicateNextOrder: (order: SanctionOrder) => void;
  onExportPdf: (order: SanctionOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onImportOrders: (orders: SanctionOrder[]) => void;
  onCreateNewFromDefault: () => void;
}

const FILTER_OPTIONS: { id: 'all' | TemplateId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'gem-gst-tds', label: 'GeM' },
  { id: 'works-bill-recoveries', label: 'Works Bill' },
  { id: 'pg-sd-refund', label: 'PG/SD Refund' },
  { id: 'student-sd-refund', label: 'Student SD' },
  { id: 'bank-forwarding-letter', label: 'Bank Letter' },
  { id: 'employee-reimbursement', label: 'Claims' },
];

export const OrderRegisterView: React.FC<OrderRegisterViewProps> = ({
  savedOrders,
  currentOrderId,
  onPreviewOrder,
  onOpenOrder,
  onDuplicateNextOrder,
  onExportPdf,
  onDeleteOrder,
  onImportOrders,
  onCreateNewFromDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<'all' | TemplateId>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return savedOrders.filter((ord) => {
      if (templateFilter !== 'all' && ord.templateId !== templateFilter) return false;
      if (!q) return true;
      const haystack = [
        ord.orderTitle,
        ord.fileRefNo,
        ord.institutionName,
        ord.overallPurpose,
        ord.payeeSummaryOverride,
        ord.accountHead,
        ord.bankLetter?.chequeNo ?? '',
        ord.bankLetter?.recipientLine2 ?? '',
        ord.bankLetter?.recipientLine3 ?? '',
        ord.bankLetter?.recipientLine4 ?? '',
        ...ord.items.map((i) => `${i.partyName} ${i.referenceNo} ${i.purpose}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [savedOrders, searchQuery, templateFilter]);

  const registerStats = useMemo(() => {
    return filteredOrders.reduce(
      (acc, ord) => {
        const totals = computeOrderTotals(ord);
        acc.gross += totals.totalGross;
        acc.net += totals.totalNet;
        return acc;
      },
      { gross: 0, net: 0 }
    );
  }, [filteredOrders]);

  const handleExportRegisterJson = () => {
    const blob = new Blob([JSON.stringify(savedOrders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SanctionDesk_Register_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          setImportError('Backup file must contain an array of sanction orders.');
          return;
        }
        const valid = parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.orderTitle === 'string' &&
            Array.isArray(item.items)
        ) as SanctionOrder[];
        if (valid.length === 0) {
          setImportError('No valid sanction order entries found in this file.');
          return;
        }
        onImportOrders(valid);
      } catch {
        setImportError('Could not read JSON backup file. Please verify the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 pt-4 pb-3 border-b border-slate-200 space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Office Order Register</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any order to preview it on the side A4 sheet.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              title="Import JSON backup"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportRegisterJson}
              disabled={savedOrders.length === 0}
              title="Export register backup as JSON"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {importError && (
          <div className="px-3 py-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
            {importError}
          </div>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order No., Contractor, Firm, Account..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#1E3A5F]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTemplateFilter(opt.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                templateFilter === opt.id
                  ? 'bg-white text-[#1E3A5F] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>
            <strong className="text-slate-900 tabular-nums">{filteredOrders.length}</strong> orders
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Net Total:{' '}
            <strong className="text-[#1E3A5F] font-mono tabular-nums">
              {formatRupeeSymbol(registerStats.net)}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto workspace-scroll divide-y divide-slate-200">
        {filteredOrders.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              {savedOrders.length === 0
                ? 'No saved orders yet'
                : 'No orders match your filter'}
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {savedOrders.length === 0
                ? 'Save an order from the editor to build your register.'
                : 'Clear your search or select All to view all saved orders.'}
            </p>
            {savedOrders.length === 0 ? (
              <button
                type="button"
                onClick={onCreateNewFromDefault}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] rounded-md"
              >
                New Sanction Order
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTemplateFilter('all');
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const totals = computeOrderTotals(ord);
            const isEditing = ord.id === currentOrderId;
            const isConfirmingDelete = confirmDeleteId === ord.id;

            return (
              <div
                key={ord.id}
                onClick={() => onPreviewOrder(ord)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreviewOrder(ord);
                  }
                }}
                className={`px-5 py-3.5 transition-colors cursor-pointer ${
                  isEditing ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {ord.orderTitle}
                      {isEditing && (
                        <span className="ml-1.5 text-xs font-medium text-[#1E3A5F]">· Active</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {ord.layoutStyle === 'bank-letter' && ord.bankLetter
                        ? `Cheque ${ord.bankLetter.chequeNo} · ${formatSlashDate(ord.bankLetter.chequeDateIso)}`
                        : `${ord.fileRefNo} · ${formatSlashDate(ord.orderDateIso)}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold font-mono tabular-nums text-slate-900">
                      {formatRupeeSymbol(totals.totalNet)}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      Gross {formatRupeeSymbol(totals.totalGross)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 truncate mt-1.5">
                  {getResolvedPayeeText(ord)} — {ord.overallPurpose}
                </div>

                <div
                  className="mt-2.5 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isConfirmingDelete ? (
                    <>
                      <span className="text-xs text-red-700 mr-1">Delete?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteOrder(ord.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenOrder(ord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-slate-200/70 rounded transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateNextOrder(ord)}
                        title="Duplicate and increment Order No."
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportPdf(ord)}
                        title="Export PDF"
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(ord.id)}
                        title="Delete order"
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
