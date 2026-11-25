import React from 'react';
import type { SanctionOrder, WorksBillConfig } from '../types/sanction';
import {
  computeWorksBill,
  DEFAULT_WORKS_BILL,
  formatRupeeSymbol,
  numberToIndianWords,
} from '../utils/indianFormat';

interface WorksBillEditorSectionProps {
  order: SanctionOrder;
  onChange: (updated: SanctionOrder) => void;
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] font-mono tabular-nums text-right';

export const WorksBillEditorSection: React.FC<WorksBillEditorSectionProps> = ({
  order,
  onChange,
}) => {
  const wb: WorksBillConfig = order.worksBill ?? DEFAULT_WORKS_BILL;
  const computed = computeWorksBill(wb);

  const patchWorks = (patch: Partial<WorksBillConfig>) => {
    onChange({
      ...order,
      worksBill: { ...wb, ...patch },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Live Summary Strip */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-slate-500">Gross Bill</div>
            <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
              {formatRupeeSymbol(computed.grossBillAmount, true)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Total Recoveries</div>
            <div className="text-sm font-semibold text-slate-700 font-mono tabular-nums mt-0.5">
              {formatRupeeSymbol(computed.totalRecoveries, true)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Net Payment</div>
            <div className="text-sm font-semibold text-[#1E3A5F] font-mono tabular-nums mt-0.5">
              {formatRupeeSymbol(computed.netPayment, true)}
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Net in Words: </span>
          {numberToIndianWords(computed.netPayment)} only.
        </div>
      </div>

      {/* Gross Bill & Work Value */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold text-slate-900">Gross Bill & Work Value</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Gross Payment of Bill (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={wb.grossBillAmount || ''}
              onChange={(e) => patchWorks({ grossBillAmount: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tax + Cess Included (%)
            </label>
            <select
              value={wb.workValueDivisorPercent}
              disabled={wb.useManualWorkValue}
              onChange={(e) =>
                patchWorks({ workValueDivisorPercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#1E3A5F] disabled:bg-slate-100"
            >
              <option value={19}>19% (18% GST + 1% Cess)</option>
              <option value={18}>18% (GST only)</option>
              <option value={13}>13% (12% GST + 1% Cess)</option>
              <option value={12}>12% (GST only)</option>
              <option value={0}>0% (Gross = Work Value)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            Work Value:{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {formatRupeeSymbol(computed.workValue, true)}
            </strong>
          </span>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={wb.useManualWorkValue}
              onChange={(e) =>
                patchWorks({
                  useManualWorkValue: e.target.checked,
                  manualWorkValue: computed.workValue,
                })
              }
              className="rounded border-slate-300 text-[#1E3A5F]"
            />
            Manual Work Value
          </label>
        </div>

        {wb.useManualWorkValue && (
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Manual Work Value (₹)
            </label>
            <input
              type="number"
              min="0"
              value={wb.manualWorkValue || ''}
              onChange={(e) => patchWorks({ manualWorkValue: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Security Deposit & EMD */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">Security Deposit & EMD</h3>
          <span className="text-xs text-slate-600 font-mono tabular-nums">
            Net SD: <strong>{formatRupeeSymbol(computed.netSdAmount, true)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              SD % on Gross ({formatRupeeSymbol(computed.sdAmount)})
            </label>
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={wb.sdPercent}
              onChange={(e) => patchWorks({ sdPercent: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Less EMD Already Deposited (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={wb.emdAmount || ''}
              onChange={(e) => patchWorks({ emdAmount: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Statutory Tax Recoveries on Work Value */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">Statutory Recoveries (on Work Value)</h3>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={wb.useManualRecoveries}
              onChange={(e) =>
                patchWorks({
                  useManualRecoveries: e.target.checked,
                  manualSd: computed.sdAmount,
                  manualCgst: computed.cgstAmount,
                  manualSgst: computed.sgstAmount,
                  manualLabourCess: computed.labourCessAmount,
                  manualIt: computed.itAmount,
                })
              }
              className="rounded border-slate-300 text-[#1E3A5F]"
            />
            Override Amounts
          </label>
        </div>

        {!wb.useManualRecoveries ? (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                CGST % ({formatRupeeSymbol(computed.cgstAmount)})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wb.cgstRate}
                onChange={(e) => patchWorks({ cgstRate: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                SGST % ({formatRupeeSymbol(computed.sgstAmount)})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wb.sgstRate}
                onChange={(e) => patchWorks({ sgstRate: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Labour Cess % ({formatRupeeSymbol(computed.labourCessAmount)})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wb.labourCessRate}
                onChange={(e) => patchWorks({ labourCessRate: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Income Tax % ({formatRupeeSymbol(computed.itAmount)})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wb.itRate}
                onChange={(e) => patchWorks({ itRate: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">SD Amount (₹)</label>
              <input
                type="number"
                value={wb.manualSd ?? computed.sdAmount}
                onChange={(e) => patchWorks({ manualSd: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">CGST Amount (₹)</label>
              <input
                type="number"
                value={wb.manualCgst ?? computed.cgstAmount}
                onChange={(e) => patchWorks({ manualCgst: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">SGST Amount (₹)</label>
              <input
                type="number"
                value={wb.manualSgst ?? computed.sgstAmount}
                onChange={(e) => patchWorks({ manualSgst: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Labour Cess (₹)</label>
              <input
                type="number"
                value={wb.manualLabourCess ?? computed.labourCessAmount}
                onChange={(e) => patchWorks({ manualLabourCess: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Income Tax (₹)</label>
              <input
                type="number"
                value={wb.manualIt ?? computed.itAmount}
                onChange={(e) => patchWorks({ manualIt: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
