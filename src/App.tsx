import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FileDown, Printer, Save, SlidersHorizontal } from 'lucide-react';
import { EditorPanel } from './components/EditorPanel';
import { OrderRegisterView } from './components/OrderRegisterView';
import { SanctionSheet } from './components/SanctionSheet';
import { TemplatesView } from './components/TemplatesView';
import {
  SANCTION_TEMPLATES,
  createManipurGemOrder,
  createOrderByTemplateId,
  createPgSdRefundOrder,
  createWorksBillRecoveriesOrder,
} from './data/templates';
import type {
  DocumentFontFamily,
  PageMarginPreset,
  PageMargins,
  SanctionOrder,
  TemplateId,
} from './types/sanction';
import {
  DOCUMENT_FONT_OPTIONS,
  MARGIN_PRESET_VALUES,
  TEXT_SIZE_OPTIONS,
  clampMarginValue,
  resolveFontSizePt,
  resolvePageMargins,
} from './utils/documentStyle';
import { incrementTrailingNumber } from './utils/indianFormat';
import { exportSanctionOrderPdf } from './utils/pdfExport';

type AppView = 'editor' | 'templates' | 'register';
type ZoomMode = 'fit' | '0.65' | '0.78' | '0.9' | '1';

const STORAGE_CURRENT_KEY = 'sanctiondesk_current_draft_v1';
const STORAGE_REGISTER_KEY = 'sanctiondesk_order_register_v2';
const A4_WIDTH_PX = 794; // 210mm at 96dpi

function loadInitialOrder(): SanctionOrder {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SanctionOrder;
      if (parsed && typeof parsed.orderTitle === 'string' && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch {
    // Fall back to default template
  }
  return createManipurGemOrder();
}

function loadInitialRegister(): SanctionOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SanctionOrder[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read error
  }
  return [
    createManipurGemOrder(),
    createWorksBillRecoveriesOrder(),
    createPgSdRefundOrder(),
  ];
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('editor');
  const [order, setOrder] = useState<SanctionOrder>(loadInitialOrder);
  const [savedOrders, setSavedOrders] = useState<SanctionOrder[]>(loadInitialRegister);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [fitScale, setFitScale] = useState<number>(0.82);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMarginsPopover, setShowMarginsPopover] = useState<boolean>(false);
  const [marginDrafts, setMarginDrafts] = useState<Record<keyof PageMargins, string> | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const marginsPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showMarginsPopover) {
      setMarginDrafts(null);
      return;
    }
    const handleOutsideClick = (e: MouseEvent) => {
      if (marginsPopoverRef.current && !marginsPopoverRef.current.contains(e.target as Node)) {
        setShowMarginsPopover(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMarginsPopover(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMarginsPopover]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Continuously compute optimal Fit-to-Width scale for the always-visible side A4 preview
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const updateFitScale = () => {
      const availableWidth = Math.max(240, el.clientWidth - 40);
      const computed = Math.min(1, Math.max(0.38, availableWidth / A4_WIDTH_PX));
      setFitScale(Number(computed.toFixed(3)));
    };

    updateFitScale();
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(order));
    } catch {
      // Ignore quota errors
    }
  }, [order]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REGISTER_KEY, JSON.stringify(savedOrders));
    } catch {
      // Ignore quota errors
    }
  }, [savedOrders]);

  const handleSaveToRegister = useCallback(() => {
    const stamped: SanctionOrder = {
      ...order,
      updatedAt: new Date().toISOString(),
    };
    setOrder(stamped);
    setSavedOrders((prev) => {
      const exists = prev.some((item) => item.id === stamped.id);
      if (exists) {
        return prev.map((item) => (item.id === stamped.id ? stamped : item));
      }
      return [stamped, ...prev];
    });
    showToast(`Saved "${stamped.orderTitle}" to Order Register`);
  }, [order, showToast]);

  const handleExportPdf = useCallback(
    (targetOrder: SanctionOrder) => {
      try {
        const filename = exportSanctionOrderPdf(targetOrder);
        showToast(`Exported ${filename}`);
      } catch {
        showToast('Could not generate PDF. Please check your order fields and retry.');
      }
    },
    [showToast]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveToRegister();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveToRegister]);

  const handleSelectTemplate = (templateId: TemplateId, openEditor = true) => {
    const fresh = createOrderByTemplateId(templateId);
    setOrder(fresh);
    if (openEditor) {
      setActiveView('editor');
    }
    showToast(`Loaded "${fresh.templateName}"`);
  };

  const handleResetCurrentTemplate = () => {
    const fresh = createOrderByTemplateId(order.templateId);
    setOrder(fresh);
    showToast('Reset form to template defaults');
  };

  const handlePreviewSavedOrder = (target: SanctionOrder) => {
    setOrder(target);
  };

  const handleOpenSavedOrder = (target: SanctionOrder) => {
    setOrder(target);
    setActiveView('editor');
    showToast(`Opened "${target.orderTitle}"`);
  };

  const handleDuplicateNextOrder = (source: SanctionOrder) => {
    const nextOrder: SanctionOrder = {
      ...source,
      id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      orderTitle: incrementTrailingNumber(source.orderTitle),
      fileRefNo: incrementTrailingNumber(source.fileRefNo),
      orderDateIso: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
      items: source.items.map((item) => ({
        ...item,
        id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    setOrder(nextOrder);
    setActiveView('editor');
    showToast(`Created ${nextOrder.orderTitle} from previous order`);
  };

  const handleDeleteSavedOrder = (orderId: string) => {
    setSavedOrders((prev) => prev.filter((item) => item.id !== orderId));
    showToast('Order removed from register');
  };

  const handleImportOrders = (incoming: SanctionOrder[]) => {
    setSavedOrders((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const merged = [...prev];
      incoming.forEach((item) => {
        if (!existingIds.has(item.id)) {
          merged.unshift(item);
        }
      });
      return merged;
    });
    showToast(`Imported ${incoming.length} order(s) into register`);
  };

  const activeScale = zoomMode === 'fit' ? fitScale : parseFloat(zoomMode);
  const currentMargins = resolvePageMargins(order);
  const currentFontSizePt = resolveFontSizePt(order);

  const handleSelectMarginPreset = (preset: Exclude<PageMarginPreset, 'custom'>) => {
    const presetValues = { ...MARGIN_PRESET_VALUES[preset] };
    setOrder({
      ...order,
      marginPreset: preset,
      customMargins: presetValues,
      updatedAt: new Date().toISOString(),
    });
    setMarginDrafts({
      top: String(presetValues.top),
      right: String(presetValues.right),
      bottom: String(presetValues.bottom),
      left: String(presetValues.left),
    });
  };

  const handleManualMarginChange = (side: keyof PageMargins, rawValue: string) => {
    const base = resolvePageMargins(order);
    setMarginDrafts((prev) => ({
      top: prev?.top ?? String(base.top),
      right: prev?.right ?? String(base.right),
      bottom: prev?.bottom ?? String(base.bottom),
      left: prev?.left ?? String(base.left),
      [side]: rawValue,
    }));

    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed)) return;
    const axis = side === 'top' || side === 'bottom' ? 'vertical' : 'horizontal';
    const clamped = clampMarginValue(parsed, axis);
    setOrder({
      ...order,
      marginPreset: 'custom',
      customMargins: {
        ...base,
        [side]: clamped,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleManualMarginBlur = (side: keyof PageMargins) => {
    const resolved = resolvePageMargins(order);
    setMarginDrafts((prev) =>
      prev
        ? {
            ...prev,
            [side]: String(resolved[side]),
          }
        : null
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#F4F5F7] text-slate-900 overflow-hidden print:h-auto print:overflow-visible">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 shrink-0">
        <button
          type="button"
          onClick={() => setActiveView('editor')}
          className="text-lg font-bold tracking-tight text-slate-900 [font-family:var(--font-display)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          SanctionDesk
        </button>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-6 text-sm font-medium"
        >
          {(
            [
              { id: 'editor', label: 'Editor' },
              { id: 'templates', label: 'Templates' },
              { id: 'register', label: 'Order Register' },
            ] as { id: AppView; label: string }[]
          ).map((navItem) => {
            const isActive = activeView === navItem.id;
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => setActiveView(navItem.id)}
                className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-[#1E3A5F] text-[#1E3A5F]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {navItem.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleExportPdf(order)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </header>

      {/* Persistent Side-by-Side Workspace: Left Active Panel + Right Always-Visible A4 Preview */}
      <main className="flex-1 flex flex-row min-h-0 overflow-hidden print:block print:overflow-visible">
        {/* Left Pane: Active View (Editor / Templates / Order Register) */}
        <div className="no-print w-[46%] min-w-[300px] max-w-[520px] h-full shrink-0">
          {activeView === 'editor' && (
            <EditorPanel
              order={order}
              onChange={setOrder}
              onResetCurrentTemplate={handleResetCurrentTemplate}
            />
          )}

          {activeView === 'templates' && (
            <TemplatesView
              activeTemplateId={order.templateId}
              onSelectTemplate={handleSelectTemplate}
            />
          )}

          {activeView === 'register' && (
            <OrderRegisterView
              savedOrders={savedOrders}
              currentOrderId={order.id}
              onPreviewOrder={handlePreviewSavedOrder}
              onOpenOrder={handleOpenSavedOrder}
              onDuplicateNextOrder={handleDuplicateNextOrder}
              onExportPdf={handleExportPdf}
              onDeleteOrder={handleDeleteSavedOrder}
              onImportOrders={handleImportOrders}
              onCreateNewFromDefault={() => handleSelectTemplate('gem-gst-tds', true)}
            />
          )}
        </div>

        {/* Right Pane: ALWAYS-VISIBLE Live A4 Print Workbench */}
        <section className="flex-1 flex flex-col min-w-0 h-full bg-[#ECEFF3] print-only-container">
          {/* Preview Controls Toolbar */}
          <div className="no-print bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="quickTemplateSelect">
                Switch template
              </label>
              <select
                id="quickTemplateSelect"
                value={order.templateId}
                onChange={(e) => handleSelectTemplate(e.target.value as TemplateId, false)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#1E3A5F] max-w-[240px] truncate"
              >
                {SANCTION_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="fontFamilySelect">
                Document font
              </label>
              <select
                id="fontFamilySelect"
                value={order.fontFamily}
                onChange={(e) =>
                  setOrder({
                    ...order,
                    fontFamily: e.target.value as DocumentFontFamily,
                    updatedAt: new Date().toISOString(),
                  })
                }
                title="Select document font family"
                className="px-2 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#1E3A5F]"
              >
                {DOCUMENT_FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="fontSizeSelect">
                Text size
              </label>
              <select
                id="fontSizeSelect"
                value={currentFontSizePt}
                onChange={(e) =>
                  setOrder({
                    ...order,
                    fontSizePt: parseFloat(e.target.value),
                    updatedAt: new Date().toISOString(),
                  })
                }
                title="Select document text size"
                className="px-2 py-1.5 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#1E3A5F]"
              >
                {TEXT_SIZE_OPTIONS.map((ptSize) => (
                  <option key={ptSize} value={ptSize}>
                    {ptSize} pt
                  </option>
                ))}
              </select>

              <div className="relative" ref={marginsPopoverRef}>
                <button
                  type="button"
                  onClick={() => setShowMarginsPopover((prev) => !prev)}
                  aria-expanded={showMarginsPopover}
                  title="Edit A4 page margins manually (mm)"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                    showMarginsPopover || order.marginPreset === 'custom'
                      ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] border-[#1E3A5F]/30'
                      : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span>Margins</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-500">
                    {currentMargins.top}/{currentMargins.left}mm
                  </span>
                </button>

                {showMarginsPopover && (
                  <div className="absolute left-0 top-full mt-1.5 z-40 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        Page Margins (mm)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectMarginPreset('standard')}
                        className="text-[11px] font-medium text-[#1E3A5F] hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-md">
                      {(
                        [
                          { id: 'compact', label: 'Compact' },
                          { id: 'standard', label: 'Standard' },
                          { id: 'formal', label: 'Wide' },
                        ] as { id: Exclude<PageMarginPreset, 'custom'>; label: string }[]
                      ).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectMarginPreset(preset.id)}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            order.marginPreset === preset.id
                              ? 'bg-white text-[#1E3A5F] shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {(
                        [
                          { side: 'top', label: 'Top', max: 60 },
                          { side: 'bottom', label: 'Bottom', max: 60 },
                          { side: 'left', label: 'Left', max: 50 },
                          { side: 'right', label: 'Right', max: 50 },
                        ] as { side: keyof PageMargins; label: string; max: number }[]
                      ).map((field) => (
                        <div key={field.side}>
                          <label
                            htmlFor={`margin-${field.side}`}
                            className="block text-[11px] font-medium text-slate-600 mb-1"
                          >
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              id={`margin-${field.side}`}
                              type="number"
                              min={5}
                              max={field.max}
                              step={1}
                              value={marginDrafts?.[field.side] ?? String(currentMargins[field.side])}
                              onChange={(e) =>
                                handleManualMarginChange(field.side, e.target.value)
                              }
                              onBlur={() => handleManualMarginBlur(field.side)}
                              className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                              mm
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      Updates live A4 preview, print output, and exported PDF.
                    </p>
                  </div>
                )}
              </div>

              <label className="sr-only" htmlFor="zoomSelect">
                Preview zoom
              </label>
              <select
                id="zoomSelect"
                value={zoomMode}
                onChange={(e) => setZoomMode(e.target.value as ZoomMode)}
                className="px-2 py-1.5 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#1E3A5F]"
              >
                <option value="fit">Fit ({Math.round(fitScale * 100)}%)</option>
                <option value="0.65">65%</option>
                <option value="0.78">78%</option>
                <option value="0.9">90%</option>
                <option value="1">100%</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveToRegister}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                Print A4
              </button>
            </div>
          </div>

          {/* Scaled Live A4 Drafting Canvas */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto workspace-scroll p-5 print-only-container"
          >
            <div
              className="mx-auto print:!w-full print:!h-auto"
              style={{
                width: `${Math.round(A4_WIDTH_PX * activeScale)}px`,
                minHeight: `${Math.round(1123 * activeScale)}px`,
              }}
            >
              <div
                className="origin-top-left transition-transform duration-150 print:!transform-none print:!w-full"
                style={{
                  transform: `scale(${activeScale})`,
                  width: '210mm',
                }}
              >
                <SanctionSheet order={order} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Subtle Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-slate-900 rounded-md shadow-lg"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
