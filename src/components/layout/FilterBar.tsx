import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MonitorFilters } from '../../hooks/useMonitorFilters';
import type { AppMetadata, UIStrings } from '../../types/monitor.types';

interface FilterBarProps {
  metadata: AppMetadata;
  ui: UIStrings;
  language: 'es' | 'en';
  filters: MonitorFilters;
  onChange: (patch: Partial<MonitorFilters>) => void;
}

export function FilterBar({ metadata, ui, language, filters, onChange }: FilterBarProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 1900);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function shareView() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <section className="filter-panel" aria-label={ui.filtersLabel} id="filters">
      <div className="filter-row">
        <span className="filter-row-label">{ui.categoryLabel}</span>
        <div className="filter-options filter-options--categories">
          {ui.categories.map((option) => (
            <button className={`filter-pill ${filters.category === option.id ? 'filter-pill--selected' : ''}`} key={option.id} type="button" aria-pressed={filters.category === option.id} onClick={() => onChange({ category: option.id })}>
              {filters.category === option.id ? <span className="pill-dot" /> : null}{option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-secondary">
        <div className="filter-row filter-row--compact">
          <span className="filter-row-label">{ui.variationLabel}</span>
          <div className="segmented-control" role="group" aria-label={ui.variationLabel}>
            {ui.variations.map((option) => (
              <button className={filters.variation === option.id ? 'segment segment--selected' : 'segment'} key={option.id} type="button" aria-pressed={filters.variation === option.id} onClick={() => onChange({ variation: option.id as MonitorFilters['variation'] })}>{option.label}</button>
            ))}
          </div>
        </div>

        <div className="filter-row filter-row--compact period-row">
          <span className="filter-row-label">{ui.periodLabel}</span>
          <div className="filter-options filter-options--periods">
            {ui.periods.map((option) => {
              const label = option.id === 'ultimo-mes' ? `${option.label} · ${language === 'en' ? metadata.latestCompleteMonthEn : metadata.latestCompleteMonth}` : option.label;
              return <button className={`filter-pill ${filters.period === option.id ? 'filter-pill--selected' : ''}`} key={option.id} type="button" aria-pressed={filters.period === option.id} onClick={() => onChange({ period: option.id as MonitorFilters['period'] })}>{label}</button>;
            })}
          </div>
          <button className="share-button" type="button" onClick={shareView} aria-live="polite">
            {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
            <span>{copyState === 'copied' ? ui.viewCopied : copyState === 'error' ? ui.copyError : ui.shareView}</span>
          </button>
        </div>

        {filters.period === 'personalizado' ? (
          <div className="custom-range">
            <label>{ui.fromDate}<input type="month" value={filters.from} onChange={(event) => onChange({ from: event.target.value })} /></label>
            <label>{ui.toDate}<input type="month" value={filters.to} onChange={(event) => onChange({ to: event.target.value })} /></label>
          </div>
        ) : null}
      </div>
    </section>
  );
}
