import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SANCTION_TEMPLATES } from '../data/templates';
import type { TemplateId } from '../types/sanction';

interface TemplatesViewProps {
  activeTemplateId: TemplateId;
  onSelectTemplate: (templateId: TemplateId, openEditor?: boolean) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  activeTemplateId,
  onSelectTemplate,
}) => {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 shrink-0">
        <h1 className="text-sm font-semibold text-slate-900">
          Automatic Government Templates
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Click any template to preview it live on the A4 sheet to the right, or open it directly in
          the editor.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto workspace-scroll divide-y divide-slate-200">
        {SANCTION_TEMPLATES.map((tpl) => {
          const isCurrent = tpl.id === activeTemplateId;
          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id, false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTemplate(tpl.id, false);
                }
              }}
              className={`px-5 py-4 transition-colors cursor-pointer ${
                isCurrent ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                <span>{tpl.category}</span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 font-medium text-[#1E3A5F]">
                    <Check className="w-3.5 h-3.5" />
                    Previewing
                  </span>
                )}
              </div>

              <h2 className="text-sm font-semibold text-slate-900 leading-snug">{tpl.name}</h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{tpl.description}</p>

              <div className="mt-2.5 text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Calculation: </span>
                {tpl.taxSummary}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate">{tpl.columnsSummary}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(tpl.id, true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A5F] hover:bg-[#162C49] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Edit Order
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
