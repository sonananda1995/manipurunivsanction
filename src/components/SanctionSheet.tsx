import React from 'react';
import type { SanctionOrder } from '../types/sanction';
import {
  computeOrderTotals,
  formatDashDate,
  formatRsSlash,
  formatRupeeSymbol,
  formatSlashDate,
  getDisplayOrderDate,
  getResolvedPayeeText,
} from '../utils/indianFormat';
import {
  DEFAULT_FONT_SIZE_PT,
  resolveFontOption,
  resolveFontSizePt,
  resolvePageMargins,
} from '../utils/documentStyle';

interface SanctionSheetProps {
  order: SanctionOrder;
}

export const SanctionSheet: React.FC<SanctionSheetProps> = ({ order }) => {
  const totals = computeOrderTotals(order);
  const displayDate = getDisplayOrderDate(order);
  const payeeText = getResolvedPayeeText(order);
  const purposeText = order.overallPurpose.trim().replace(/\.$/, '');
  const cleanHead = order.accountHead.trim().replace(/^["“]+|["”]+$/g, '');
  const layoutStyle = order.layoutStyle ?? 'vendor-table';
  const showDecimals = Boolean(order.showDecimals);

  const hasD1 = order.taxMode !== 'none' && order.showDeduction1;
  const hasD2 = order.taxMode !== 'none' && order.showDeduction2;
  const hasAnyDeduction = hasD1 || hasD2;

  const margins = resolvePageMargins(order);
  const fontOption = resolveFontOption(order.fontFamily);
  const fontSizePt = resolveFontSizePt(order);
  const baseFontPx = Number(((fontSizePt / DEFAULT_FONT_SIZE_PT) * 14.5).toFixed(2));
  const bankFontPx = Number(((fontSizePt / DEFAULT_FONT_SIZE_PT) * 15).toFixed(2));

  const sheetStyle: React.CSSProperties = {
    paddingTop: `${margins.top}mm`,
    paddingRight: `${margins.right}mm`,
    paddingBottom: `${margins.bottom}mm`,
    paddingLeft: `${margins.left}mm`,
    fontFamily: fontOption.cssFamily,
    fontSize: `${layoutStyle === 'bank-letter' ? bankFontPx : baseFontPx}px`,
  };

  const copyEntries = order.copyToList.map((entry) => entry.trim()).filter(Boolean);
  const isBoldOrderTitle = order.orderTitleStyle === 'bold';
  const isRefBold = order.openingRefBold !== false;
  const connector = (order.openingClauseConnector || 'on account of').trim();
  const cleanEndorsementRef = order.fileRefNo.trim().replace(/:$/, '');
  const endorsementDate = displayDate.replace(/,\s+(\d{4})$/, ' $1');

  // DEDICATED BANK FORWARDING LETTER FORMAT (Cheque + Annexure Credit)
  if (layoutStyle === 'bank-letter') {
    const bl = order.bankLetter ?? {
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
    const isBoldFigure = order.boldAmountInFigure ?? true;
    const isBoldWords = order.boldAmountInWords ?? true;

    return (
      <article
        id="sanction-print-sheet"
        style={sheetStyle}
        className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.06)] leading-[1.58] select-text"
      >
        {bl.showLetterhead && (
          <header className="text-center mb-10 pb-3 border-b border-black">
            {order.logoDataUrl && (
              <div className="flex justify-center mb-2">
                <img
                  src={order.logoDataUrl}
                  alt={`${order.institutionName} emblem`}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 object-contain"
                />
              </div>
            )}
            <div className="text-[1.27em] font-bold tracking-[0.01em] text-black">
              {order.institutionName.trim() || 'MANIPUR UNIVERSITY'}
            </div>
            {order.institutionLocation.trim() && (
              <div className="text-[1.07em] font-bold text-black mt-0.5">
                {order.institutionLocation.trim()}
              </div>
            )}
          </header>
        )}

        {/* Recipient Address Block */}
        <div className="space-y-0.5 mb-8 text-left">
          {bl.recipientLine1.trim() && <div>{bl.recipientLine1.trim()}</div>}
          {bl.recipientLine2.trim() && <div>{bl.recipientLine2.trim()}</div>}
          {bl.recipientLine3.trim() && <div>{bl.recipientLine3.trim()}</div>}
          {bl.recipientLine4.trim() && <div>{bl.recipientLine4.trim()}</div>}
        </div>

        {/* Salutation */}
        {bl.salutation.trim() && <div className="mb-3">{bl.salutation.trim()}</div>}

        {/* Indented Body Paragraph with Bold Cheque No., Date & Amount */}
        <p className="text-justify leading-[1.68] indent-16 mb-28">
          <span>{bl.bodyPrefix.trim()}</span>
          <span className="inline-block w-14" aria-hidden="true" />
          <strong className="font-bold tabular-nums">{bl.chequeNo.trim()}</strong>
          <span className="inline-block w-14" aria-hidden="true" />
          <strong className="font-bold tabular-nums">
            Dated {formatSlashDate(bl.chequeDateIso)}
          </strong>
          <span> for </span>
          {isBoldFigure ? (
            <strong className="font-bold tabular-nums">{formatRupeeSymbol(bl.chequeAmount)}</strong>
          ) : (
            <span className="tabular-nums">{formatRupeeSymbol(bl.chequeAmount)}</span>
          )}
          <span> </span>
          {isBoldWords ? (
            <strong className="font-bold">({totals.grossInWords})</strong>
          ) : (
            <span>({totals.grossInWords})</span>
          )}
          <span> {bl.bodySuffix.trim()}</span>
        </p>

        {/* Dual Left & Right Joint Signatories */}
        <div className="mt-36 px-12 flex items-start justify-between gap-8 text-[1em] leading-[1.5]">
          <div className="min-w-[180px] text-left">
            {bl.leftSignatoryTitle.trim() && <div>{bl.leftSignatoryTitle.trim()}</div>}
            {bl.leftSignatoryOrg.trim() && <div>{bl.leftSignatoryOrg.trim()}</div>}
          </div>
          <div className="min-w-[180px] text-left">
            {bl.rightSignatoryTitle.trim() && <div>{bl.rightSignatoryTitle.trim()}</div>}
            {bl.rightSignatoryOrg.trim() && <div>{bl.rightSignatoryOrg.trim()}</div>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      id="sanction-print-sheet"
      style={sheetStyle}
      className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.06)] leading-[1.48] select-text"
    >
      {/* Header Block */}
      <header className="text-center mb-6">
        {order.logoDataUrl && (
          <div className="flex justify-center mb-2.5">
            <img
              src={order.logoDataUrl}
              alt={`${order.institutionName} emblem`}
              referrerPolicy="no-referrer"
              className="h-16 w-16 object-contain"
            />
          </div>
        )}

        <div className="text-[1.31em] font-bold tracking-[0.01em] leading-snug text-black">
          {order.institutionName.trim() || 'INSTITUTION NAME'}
        </div>

        {order.institutionLocation.trim() && (
          <div className="text-[1.17em] font-bold tracking-[0.01em] leading-snug text-black mt-0.5">
            {order.institutionLocation.trim()}
          </div>
        )}

        <div className={isBoldOrderTitle ? 'mt-3' : 'mt-1.5'}>
          <span
            className={
              isBoldOrderTitle
                ? 'text-[1.07em] font-bold text-black'
                : 'text-[1.07em] font-normal underline underline-offset-[3px] decoration-black decoration-[1px]'
            }
          >
            {order.orderTitle.trim() || 'OFFICE ORDER'}
          </span>
        </div>

        <div
          className={`text-[1.03em] mt-1 text-black ${isBoldOrderTitle ? 'font-bold' : 'font-normal'}`}
        >
          {displayDate}
        </div>
      </header>

      {/* Opening Sanction Paragraph */}
      {(() => {
        const isBoldFigure =
          order.boldAmountInFigure ?? layoutStyle !== 'particular-amount';
        const isBoldWords = Boolean(order.boldAmountInWords);
        const isBoldPayee = Boolean(order.boldPayeeName);

        const amountFigureNode = isBoldFigure ? (
          <strong className="font-bold tabular-nums">{formatRsSlash(totals.totalGross)}</strong>
        ) : (
          <span className="tabular-nums">{formatRsSlash(totals.totalGross)}</span>
        );

        const amountWordsNode = isBoldWords ? (
          <strong className="font-bold">({totals.grossInWords})</strong>
        ) : (
          <span>({totals.grossInWords})</span>
        );

        const payeeNode = isBoldPayee ? (
          <strong className="font-bold">{payeeText}</strong>
        ) : (
          <span>{payeeText}</span>
        );

        return (
          <p
            className={`text-justify mb-3 text-[1em] leading-[1.54] ${
              layoutStyle === 'particular-amount' ? 'indent-10' : ''
            }`}
          >
            {isRefBold ? (
              <strong className="font-bold">{order.fileRefNo.trim()}</strong>
            ) : (
              <span>{order.fileRefNo.trim()}</span>
            )}
            <span className="inline-block w-5" aria-hidden="true" />
            {order.useCustomOpeningParagraph && order.customOpeningParagraph.trim() ? (
              <span>{order.customOpeningParagraph.trim()}</span>
            ) : order.openingClauseMode === 'not-exceeding' ? (
              <>
                <span>{order.sanctioningAuthorityPhrase.trim()} </span>
                {amountFigureNode}
                <span> </span>
                {amountWordsNode}
                <span> only is hereby approved and sanctioned in favour of </span>
                {payeeNode}
                <span>
                  {' '}
                  {connector} {purposeText}.
                </span>
              </>
            ) : (
              <>
                <span>{order.sanctioningAuthorityPhrase.trim()} </span>
                {amountFigureNode}
                <span> </span>
                {amountWordsNode}
                <span> only in favour of </span>
                {payeeNode}
                <span>
                  {' '}
                  {connector} {purposeText}.
                  {layoutStyle === 'lump-sum-annexure' && order.lumpSum?.annexureNote?.trim()
                    ? ` ${order.lumpSum.annexureNote.trim()}`
                    : ''}
                </span>
              </>
            )}
          </p>
        );
      })()}

      {/* Table Intro */}
      {order.tableIntroText.trim() && (
        <p className="mb-1.5 text-[1em]">{order.tableIntroText.trim()}</p>
      )}

      {/* LAYOUT 1: Civil Works Bill with Statutory Recoveries */}
      {layoutStyle === 'works-recoveries' && totals.works && (
        <div className="w-full mb-5 text-[0.96em] leading-[1.55]">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="py-1 pr-3 w-[34%] text-left">Gross Payment of the Bill:</td>
                <td className="py-1 px-3 w-[28%] text-right" />
                <td className="py-1 pl-3 w-[38%] text-center font-normal tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.grossBillAmount, true)}
                </td>
              </tr>

              <tr>
                <td colSpan={3} className="h-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">Work Value:</td>
                <td className="py-0.5 px-3 text-right font-bold tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.workValue, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">Recoveries:</td>
                <td className="py-0.5 px-3" />
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">
                  {order.worksBill?.sdPercent ?? 5}% SD:
                </td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.sdAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">Less EMD:</td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.emdAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left" />
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap border-t border-black/30">
                  {formatRupeeSymbol(totals.works.netSdAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">
                  Less {order.worksBill?.cgstRate ?? 1}% CGST:
                </td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.cgstAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">
                  Less {order.worksBill?.sgstRate ?? 1}% SGST:
                </td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.sgstAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">
                  Less {order.worksBill?.labourCessRate ?? 1}% Labour Cess:
                </td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.labourCessAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-0.5 pr-3 text-left">
                  Less {order.worksBill?.itRate ?? 2}% IT:
                </td>
                <td className="py-0.5 px-3 text-right tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.itAmount, true)}
                </td>
                <td className="py-0.5 pl-3" />
              </tr>

              <tr>
                <td className="py-1 pr-3 text-right font-bold">Total:</td>
                <td className="py-1 px-3 text-right font-bold tabular-nums whitespace-nowrap border-t border-black/40">
                  {formatRupeeSymbol(totals.works.totalRecoveries, true)}
                </td>
                <td className="py-1 pl-3" />
              </tr>

              <tr>
                <td className="py-1 pr-3" />
                <td className="py-1 px-3 text-right font-bold">Net Payment :</td>
                <td className="py-1 pl-3 text-center font-bold tabular-nums whitespace-nowrap">
                  {formatRupeeSymbol(totals.works.netPayment, true)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-center mt-2.5 text-[1em]">
            ({totals.netInWords}) only.
          </p>
        </div>
      )}

      {/* LAYOUT 2: Particular & Amount Table (Performance Guarantee & Security Deposit Refund) */}
      {layoutStyle === 'particular-amount' && (
        <div className="w-full my-5">
          <table className="w-full border-collapse border border-black text-[0.96em] leading-[1.4]">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1.5 font-normal text-center w-[54px]">
                  {order.columnLabels.slNo}
                </th>
                <th className="border border-black px-3 py-1.5 font-normal text-center">
                  {order.columnLabels.party}
                </th>
                <th className="border border-black px-3 py-1.5 font-normal text-center w-[150px]">
                  {order.columnLabels.grossAmount}
                </th>
              </tr>
            </thead>
            <tbody>
              {totals.rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="border border-black px-3 py-4 text-center text-slate-500 italic">
                    No particulars added yet. Add a refund row in the editor.
                  </td>
                </tr>
              ) : (
                totals.rows.map((row, idx) => (
                  <tr key={row.item.id}>
                    <td className="border border-black px-2 py-1.5 text-center tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-3 py-1.5 text-center">
                      {row.item.partyName || '—'}
                    </td>
                    <td className="border border-black px-3 py-1.5 text-right whitespace-nowrap tabular-nums">
                      {formatRupeeSymbol(row.item.grossAmount, showDecimals)}
                    </td>
                  </tr>
                ))
              )}

              <tr>
                <td
                  colSpan={2}
                  className="border border-black px-4 py-1.5 text-right font-bold"
                >
                  Total:
                </td>
                <td className="border border-black px-3 py-1.5 text-right whitespace-nowrap tabular-nums">
                  {formatRupeeSymbol(totals.totalGross, showDecimals)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* LAYOUT 3: Standard Multi-Column Vendor / GeM / Employee Table */}
      {layoutStyle === 'vendor-table' && (
        <div className="w-full mb-6">
          <table className="w-full border-collapse border border-black text-[0.9em] leading-[1.32]">
            <thead>
              <tr>
                <th className="border border-black px-1.5 py-1.5 font-normal text-center align-middle w-[38px] whitespace-pre-line">
                  {order.columnLabels.slNo}
                </th>
                <th className="border border-black px-2 py-1.5 font-normal text-center align-middle">
                  {order.columnLabels.party}
                </th>
                <th className="border border-black px-2 py-1.5 font-normal text-center align-middle">
                  {order.columnLabels.purpose}
                </th>
                <th className="border border-black px-2 py-1.5 font-normal text-center align-middle">
                  {order.columnLabels.reference}
                </th>
                <th className="border border-black px-2 py-1.5 font-normal text-center align-middle w-[108px]">
                  {order.columnLabels.grossAmount}
                </th>
                {hasD1 && (
                  <th className="border border-black px-1.5 py-1.5 font-normal text-center align-middle w-[74px]">
                    {order.columnLabels.deduction1}
                  </th>
                )}
                {hasD2 && (
                  <th className="border border-black px-1.5 py-1.5 font-normal text-center align-middle w-[74px]">
                    {order.columnLabels.deduction2}
                  </th>
                )}
                {hasAnyDeduction && (
                  <th className="border border-black px-2 py-1.5 font-normal text-center align-middle w-[104px]">
                    {order.columnLabels.netPayment}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {totals.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + (hasD1 ? 1 : 0) + (hasD2 ? 1 : 0) + (hasAnyDeduction ? 1 : 0)}
                    className="border border-black px-3 py-4 text-center text-slate-500 italic"
                  >
                    No line items added yet. Add a firm or beneficiary row in the editor.
                  </td>
                </tr>
              ) : (
                totals.rows.map((row, idx) => (
                  <tr key={row.item.id}>
                    <td className="border border-black px-1.5 py-1.5 text-center align-middle tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-left align-middle">
                      {row.item.partyName || '—'}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-left align-middle">
                      {row.item.purpose || '—'}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-left align-middle tabular-nums">
                      {row.item.referenceNo || '—'}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                      {formatRupeeSymbol(row.item.grossAmount, showDecimals)}
                    </td>
                    {hasD1 && (
                      <td className="border border-black px-1.5 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        {formatRupeeSymbol(row.deduction1, showDecimals)}
                      </td>
                    )}
                    {hasD2 && (
                      <td className="border border-black px-1.5 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        {formatRupeeSymbol(row.deduction2, showDecimals)}
                      </td>
                    )}
                    {hasAnyDeduction && (
                      <td className="border border-black px-2 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        {formatRupeeSymbol(row.netPayment, showDecimals)}
                      </td>
                    )}
                  </tr>
                ))
              )}

              {/* Total Row — merge all preceding blank columns with Total */}
              {(() => {
                const showSubTotals = !hasAnyDeduction || order.showTotalInGrossColumn;
                const totalLabelColSpan = showSubTotals
                  ? 4
                  : 5 + (hasD1 ? 1 : 0) + (hasD2 ? 1 : 0);

                return (
                  <tr>
                    <td
                      colSpan={totalLabelColSpan}
                      className="border border-black px-3 py-1.5 text-right align-middle font-bold"
                    >
                      Total
                    </td>
                    {showSubTotals && (
                      <td className="border border-black px-2 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        <span className={!hasAnyDeduction ? 'font-bold' : ''}>
                          {formatRupeeSymbol(totals.totalGross, showDecimals)}
                        </span>
                      </td>
                    )}
                    {showSubTotals && hasD1 && (
                      <td className="border border-black px-1.5 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        {formatRupeeSymbol(totals.totalDeduction1, showDecimals)}
                      </td>
                    )}
                    {showSubTotals && hasD2 && (
                      <td className="border border-black px-1.5 py-1.5 text-right align-middle whitespace-nowrap tabular-nums">
                        {formatRupeeSymbol(totals.totalDeduction2, showDecimals)}
                      </td>
                    )}
                    {hasAnyDeduction && (
                      <td className="border border-black px-2 py-1.5 text-right align-middle whitespace-nowrap tabular-nums font-bold">
                        {formatRupeeSymbol(totals.totalNet, showDecimals)}
                      </td>
                    )}
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Delegation & Account Head Clause */}
      {order.useCustomDelegationParagraph && order.customDelegationParagraph.trim() ? (
        <p className="text-justify indent-10 mb-7 text-[1em] leading-[1.55] whitespace-pre-line">
          {order.customDelegationParagraph.trim()}
        </p>
      ) : order.delegationStyle === 'two-line-works' ? (
        <div className="space-y-2.5 mb-6 text-[1em] leading-[1.52]">
          <p className="text-justify">
            The amount is sanctioned by {order.delegationAuthority || 'Vice Chancellor'} at{' '}
            {order.noteSheetNo.trim()} dated {formatSlashDate(order.noteSheetDateIso)}.
          </p>
          <p className="text-justify">
            The expenditure would be debitable to the head of Account “{cleanHead}” for the year{' '}
            {order.financialYear.trim()}.
          </p>
        </div>
      ) : order.delegationStyle === 'two-line-deposit' ? (
        <div className="space-y-4 mb-7 text-[1em] leading-[1.55]">
          <p className="text-justify indent-10">
            The amount is approved by {order.delegationAuthority || 'Registrar'} at{' '}
            {order.noteSheetNo.trim()} dated {formatDashDate(order.noteSheetDateIso)} as per the{' '}
            {order.delegationBody.trim()}.
          </p>
          <p className="text-justify indent-10">
            The amount is debitable to the {order.accountHead.trim()} for the year{' '}
            {order.financialYear.trim()}.
          </p>
        </div>
      ) : order.delegationStyle === 'combined-account' ? (
        <p className="text-justify indent-10 mt-6 mb-8 text-[1em] leading-[1.55]">
          <span>
            This sanction has been accorded in exercise of the powers delegated by{' '}
            {order.delegationBody.trim()} at {order.noteSheetNo.trim()} dated{' '}
            {formatSlashDate(order.noteSheetDateIso)}. The expenditure would be debitable to the
            Account “{cleanHead}” for the year {order.financialYear.trim()}.
          </span>
        </p>
      ) : (
        <p className="text-justify indent-10 mb-8 text-[1em] leading-[1.55]">
          <span>
            This sanction has been accorded in exercise of the powers delegated by{' '}
            {order.delegationBody.trim()} at {order.noteSheetNo.trim()} dated{' '}
            {formatSlashDate(order.noteSheetDateIso)}. The expenditure would be debitable to the
            head of Account{' '}
          </span>
          <strong className="font-bold">“{cleanHead}”</strong>
          <span> for the year {order.financialYear.trim()}.</span>
        </p>
      )}

      {/* Right-Aligned Approval Sign-off Block */}
      {order.showApprovalBlock && (
        <div className="flex justify-end mb-5">
          <div className="w-[240px] text-center text-[1em] leading-[1.5]">
            {order.approvalLine1.trim() && <div>{order.approvalLine1.trim()}</div>}
            {order.approvalLine2.trim() && <div>{order.approvalLine2.trim()}</div>}
            {order.approvalAuthorityTitle.trim() && (
              <div>{order.approvalAuthorityTitle.trim()}</div>
            )}
            {order.approvalInstitution?.trim() && <div>{order.approvalInstitution.trim()}</div>}
          </div>
        </div>
      )}

      {/* Optional Endorsement Memo Bar (Works Bill Style) */}
      {order.showEndorsementBar && (
        <div className="flex items-center justify-between text-[0.96em] mb-2">
          <span>{cleanEndorsementRef}</span>
          <span className="w-[240px] text-center">{endorsementDate}</span>
        </div>
      )}

      {/* Copy To Distribution Block */}
      {copyEntries.length > 0 && (
        <div className="mb-8 text-[1em] leading-[1.5]">
          <div className="mb-1">{order.copyToTitle.trim() || 'Copy to:'}</div>
          <ol
            className={`list-none space-y-0.5 ${
              layoutStyle === 'particular-amount' ? 'pl-10' : 'pl-6'
            }`}
          >
            {copyEntries.map((entry, idx) => (
              <li
                key={`${idx}-${entry.slice(0, 12)}`}
                className={`flex items-start ${
                  layoutStyle === 'particular-amount' ? 'gap-5' : 'gap-1'
                }`}
              >
                <span className="tabular-nums shrink-0">{idx + 1}.</span>
                <span>{entry}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Bottom-Right Issuing Officer Signature Block */}
      <div className="flex justify-end pt-2">
        <div className="w-[240px] text-center text-[1em] leading-[1.5]">
          {order.issuerName.trim() && <div>{order.issuerName.trim()}</div>}
          {order.issuerDesignation.trim() && <div>{order.issuerDesignation.trim()}</div>}
          {order.issuerInstitution.trim() && <div>{order.issuerInstitution.trim()}</div>}
        </div>
      </div>
    </article>
  );
};
