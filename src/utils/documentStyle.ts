import type {
  DocumentFontFamily,
  PageMarginPreset,
  PageMargins,
  SanctionOrder,
} from '../types/sanction';

export interface DocumentFontOption {
  id: DocumentFontFamily;
  label: string;
  cssFamily: string;
  pdfFont: 'helvetica' | 'times' | 'courier';
}

export const DOCUMENT_FONT_OPTIONS: DocumentFontOption[] = [
  {
    id: 'sans',
    label: 'Calibri (Carlito)',
    cssFamily: '"Carlito", "Calibri", "Liberation Sans", Arial, sans-serif',
    pdfFont: 'helvetica',
  },
  {
    id: 'arial',
    label: 'Arial',
    cssFamily: '"Arimo", Arial, Helvetica, sans-serif',
    pdfFont: 'helvetica',
  },
  {
    id: 'serif',
    label: 'Times New Roman',
    cssFamily: '"Tinos", "Times New Roman", "Source Serif 4", serif',
    pdfFont: 'times',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    cssFamily: 'Georgia, "Source Serif 4", serif',
    pdfFont: 'times',
  },
  {
    id: 'garamond',
    label: 'Garamond',
    cssFamily: '"EB Garamond", Garamond, Georgia, serif',
    pdfFont: 'times',
  },
  {
    id: 'courier',
    label: 'Courier Mono',
    cssFamily: '"IBM Plex Mono", "Courier New", Courier, monospace',
    pdfFont: 'courier',
  },
];

export const TEXT_SIZE_OPTIONS: number[] = [9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14];

export const DEFAULT_FONT_SIZE_PT = 11;

export const MARGIN_PRESET_VALUES: Record<Exclude<PageMarginPreset, 'custom'>, PageMargins> = {
  compact: { top: 13, right: 14, bottom: 13, left: 14 },
  standard: { top: 16, right: 17, bottom: 16, left: 17 },
  formal: { top: 20, right: 22, bottom: 20, left: 22 },
};

export function clampMarginValue(value: number, axis: 'vertical' | 'horizontal'): number {
  if (!Number.isFinite(value)) return axis === 'vertical' ? 16 : 17;
  const max = axis === 'vertical' ? 60 : 50;
  return Math.min(max, Math.max(5, Math.round(value * 10) / 10));
}

export function resolvePageMargins(order: Pick<SanctionOrder, 'marginPreset' | 'customMargins'>): PageMargins {
  if (order.marginPreset === 'custom' && order.customMargins) {
    return {
      top: clampMarginValue(order.customMargins.top, 'vertical'),
      right: clampMarginValue(order.customMargins.right, 'horizontal'),
      bottom: clampMarginValue(order.customMargins.bottom, 'vertical'),
      left: clampMarginValue(order.customMargins.left, 'horizontal'),
    };
  }
  const presetKey =
    order.marginPreset === 'compact' || order.marginPreset === 'formal'
      ? order.marginPreset
      : 'standard';
  return { ...MARGIN_PRESET_VALUES[presetKey] };
}

export function resolveFontOption(fontFamily?: DocumentFontFamily): DocumentFontOption {
  return (
    DOCUMENT_FONT_OPTIONS.find((opt) => opt.id === fontFamily) ?? DOCUMENT_FONT_OPTIONS[0]
  );
}

export function resolveFontSizePt(order: Pick<SanctionOrder, 'fontSizePt'>): number {
  const raw = order.fontSizePt;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULT_FONT_SIZE_PT;
  return Math.min(16, Math.max(8, raw));
}
