import { useCallback, useEffect, useState } from 'react';
import type { AppMetadata, PeriodId, Variation } from '../types/monitor.types';

export interface MonitorFilters {
  category: string;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
}

const DEFAULT_FILTERS: MonitorFilters = {
  category: 'vision-general',
  variation: 'mensual',
  period: 'ultimo',
  from: '',
  to: '',
};

function readLocation(metadata: AppMetadata): MonitorFilters {
  const params = new URLSearchParams(window.location.search);
  const categoryIds = new Set(metadata.ui.es.categories.map((option) => option.id));
  const variationIds = new Set(metadata.ui.es.variations.map((option) => option.id));
  const periodIds = new Set(metadata.ui.es.periods.map((option) => option.id));
  const category = params.get('categoria') ?? DEFAULT_FILTERS.category;
  const variation = params.get('variacion') ?? DEFAULT_FILTERS.variation;
  const period = params.get('periodo') ?? DEFAULT_FILTERS.period;

  return {
    category: categoryIds.has(category) ? category : DEFAULT_FILTERS.category,
    variation: variationIds.has(variation) ? (variation as Variation) : DEFAULT_FILTERS.variation,
    period: periodIds.has(period) ? (period as PeriodId) : DEFAULT_FILTERS.period,
    from: params.get('desde') ?? '',
    to: params.get('hasta') ?? '',
  };
}

function writeLocation(filters: MonitorFilters) {
  const params = new URLSearchParams(window.location.search);
  params.set('categoria', filters.category);
  params.set('variacion', filters.variation);
  params.set('periodo', filters.period);
  if (filters.period === 'personalizado') {
    if (filters.from) params.set('desde', filters.from);
    else params.delete('desde');
    if (filters.to) params.set('hasta', filters.to);
    else params.delete('hasta');
  } else {
    params.delete('desde');
    params.delete('hasta');
  }
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
}

export function useMonitorFilters(metadata: AppMetadata): [MonitorFilters, (patch: Partial<MonitorFilters>) => void] {
  const [filters, setFilters] = useState<MonitorFilters>(() => readLocation(metadata));

  useEffect(() => {
    writeLocation(readLocation(metadata));
    const syncFromLocation = () => setFilters(readLocation(metadata));
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [metadata]);

  const update = useCallback((patch: Partial<MonitorFilters>) => {
    setFilters((current) => {
      const next = { ...current, ...patch };
      writeLocation(next);
      return next;
    });
  }, []);

  return [filters, update];
}
