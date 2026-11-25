import React from 'react';
import type { BankLetterConfig, SanctionOrder } from '../types/sanction';
import { formatRupeeSymbol, numberToIndianWords } from '../utils/indianFormat';

interface BankLetterEditorSectionProps {
  order: SanctionOrder;
  onChange: (updated: SanctionOrder) => void;
}

const DEFAULT_BANK_LETTER: BankLetterConfig = {
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
};

const inputClass =
  'w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-colors placeholder:text-slate-400';

const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

export const BankLetterEditorSection: React.FC<BankLetterEditorSectionProps> = ({
  order,
  onChange,
}) => {
  const bl: BankLetterConfig = order.bankLetter ?? DEFAULT_BANK_LETTER;

  const patchBank = (patch: Partial<BankLetterConfig>) => {
    const nextBank = { ...bl, ...patch };
    onChange({
      ...order,
      bankLetter: nextBank,
      orderTitle: `Bank Cheque No. ${nextBank.chequeNo || 'Letter'}`,
      orderDateIso: nextBank.chequeDateIso || order.orderDateIso,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5">
      {/* Live Amount Summary */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-slate-500">Cheque Amount</span>
          <span className="text-sm font-semibold text-[#1E3A5F] font-mono tabular-nums">
            {formatRupeeSymbol(bl.chequeAmount)}
          </span>
        </div>
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">In Words: </span>
          {numberToIndianWords(bl.chequeAmount)} only
        </div>
      </div>

      {/* Optional University Letterhead */}
      <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={bl.showLetterhead}
          onChange={(e) => patchBank({ showLetterhead: e.target.checked })}
          className="rounded border-slate-300 text-[#1E3A5F]"
        />
        Print Institution Letterhead at top (uncheck if using pre-printed letterhead)
      </label>

      {bl.showLetterhead && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
          <div>
            <label className={labelClass}>Institution Name</label>
            <input
              type="text"
              value={order.institutionName}
              onChange={(e) =>
                onChange({ ...order, institutionName: e.target.value, updatedAt: new Date().toISOString() })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Campus / Location</label>
            <input
              type="text"
              value={order.institutionLocation}
              onChange={(e) =>
                onChange({ ...order, institutionLocation: e.target.value, updatedAt: new Date().toISOString() })
              }
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Bank Recipient Block */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold text-slate-900">Bank Recipient Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Line 1</label>
            <input
              type="text"
              value={bl.recipientLine1}
              onChange={(e) => patchBank({ recipientLine1: e.target.value })}
              placeholder="To"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Bank Officer Designation
            </label>
            <input
              type="text"
              value={bl.recipientLine2}
              onChange={(e) => patchBank({ recipientLine2: e.target.value })}
              placeholder="Chief Manager"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Bank Name</label>
            <input
              type="text"
              value={bl.recipientLine3}
              onChange={(e) => patchBank({ recipientLine3: e.target.value })}
              placeholder="State Bank of India"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Branch Name</label>
            <input
              type="text"
              value={bl.recipientLine4}
              onChange={(e) => patchBank({ recipientLine4: e.target.value })}
              placeholder="MU Campus"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Salutation</label>
          <input
            type="text"
            value={bl.salutation}
            onChange={(e) => patchBank({ salutation: e.target.value })}
            placeholder="Sir/Madam,"
            className={`${inputClass} !py-1.5 text-xs`}
          />
        </div>
      </div>

      {/* Cheque & Credit Details */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold text-slate-900">Cheque & Annexure Credit Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Cheque No.
            </label>
            <input
              type="text"
              value={bl.chequeNo}
              onChange={(e) => patchBank({ chequeNo: e.target.value })}
              placeholder="496288"
              className={`${inputClass} !py-1.5 text-xs font-mono`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Cheque Date
            </label>
            <input
              type="date"
              value={bl.chequeDateIso}
              onChange={(e) => patchBank({ chequeDateIso: e.target.value })}
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={bl.chequeAmount || ''}
              onChange={(e) => patchBank({ chequeAmount: parseFloat(e.target.value) || 0 })}
              placeholder="310000"
              className={`${inputClass} !py-1.5 text-xs font-mono tabular-nums text-right`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Opening Phrase
          </label>
          <input
            type="text"
            value={bl.bodyPrefix}
            onChange={(e) => patchBank({ bodyPrefix: e.target.value })}
            placeholder="Enclose herewith is Cheque no."
            className={`${inputClass} !py-1.5 text-xs`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Credit Instruction / Annexure Text
          </label>
          <textarea
            rows={2}
            value={bl.bodySuffix}
            onChange={(e) => patchBank({ bodySuffix: e.target.value })}
            placeholder="only for crediting to the individual accounts listed on Annexure-I."
            className={`${inputClass} !py-1.5 text-xs`}
          />
        </div>

        {/* Bold Formatting Controls */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
          <span className="block text-[11px] font-semibold text-slate-700">
            Bold Formatting in Letter Body
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={order.boldAmountInFigure ?? true}
                onChange={(e) =>
                  onChange({
                    ...order,
                    boldAmountInFigure: e.target.checked,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Amount in Figure
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={order.boldAmountInWords ?? true}
                onChange={(e) =>
                  onChange({
                    ...order,
                    boldAmountInWords: e.target.checked,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Amount in Words
            </label>
          </div>
        </div>
      </div>

      {/* Dual Joint Signatories */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-900">Joint Signatories (Left & Right)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">Left Signatory</label>
            <input
              type="text"
              value={bl.leftSignatoryTitle}
              onChange={(e) => patchBank({ leftSignatoryTitle: e.target.value })}
              placeholder="Registrar"
              className={`${inputClass} !py-1.5 text-xs`}
            />
            <input
              type="text"
              value={bl.leftSignatoryOrg}
              onChange={(e) => patchBank({ leftSignatoryOrg: e.target.value })}
              placeholder="Manipur University"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">
              Right Signatory
            </label>
            <input
              type="text"
              value={bl.rightSignatoryTitle}
              onChange={(e) => patchBank({ rightSignatoryTitle: e.target.value })}
              placeholder="Finance Officer"
              className={`${inputClass} !py-1.5 text-xs`}
            />
            <input
              type="text"
              value={bl.rightSignatoryOrg}
              onChange={(e) => patchBank({ rightSignatoryOrg: e.target.value })}
              placeholder="Manipur University"
              className={`${inputClass} !py-1.5 text-xs`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
