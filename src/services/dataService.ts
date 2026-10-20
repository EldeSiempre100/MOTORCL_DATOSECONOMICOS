import type {
  AppMetadata,
  ChartsData,
  DashboardData,
  SummaryCardsData,
  TimelineData,
} from '../types/monitor.types';

const MOCK_DATA_PATH = '/mock-data';

async function fetchJson<T>(fileName: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${MOCK_DATA_PATH}/${fileName}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${fileName} (${response.status})`);
  }

  return (await response.json()) as T;
}

/** Loads every visible economic label/value from the static JSON contracts. */
export async function loadDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const [metadata, timeline, summaries, charts] = await Promise.all([
    fetchJson<AppMetadata>('app_metadata.json', signal),
    fetchJson<TimelineData>('timeline_events.json', signal),
    fetchJson<SummaryCardsData>('summary_cards.json', signal),
    fetchJson<ChartsData>('charts_series.json', signal),
  ]);

  // Defense in depth: no illustrative figures can be shown even before a data refresh.
  return {
    metadata,
    timeline: { ...timeline, events: timeline.events.filter(item => item.dataStatus === 'official') },
    summaries: { ...summaries, cards: summaries.cards.filter(item => item.dataStatus === 'official' || item.dataStatus === 'sourced') },
    charts: { ...charts, charts: charts.charts.filter(item => item.dataStatus === 'official' || item.dataStatus === 'sourced') },
  };
}

export interface SeriesObservation {
  period: string;
  observedFrom: string;
  observedTo: string;
  value: number;
  publishedAt: string | null;
  documentUrl: string | null;
  sourceStatus: string | null;
  revisions: Array<{ detectedAt: string; previousValue: number; newValue: number }>;
}

export interface PublishedSeries {
  id: string;
  organization: string;
  officialCode: string;
  name: string;
  nameEn: string;
  unit: string;
  frequency: string;
  sourceUrl: string;
  methodologyUrl: string;
  lastSuccessfulRefresh: string;
  observations: SeriesObservation[];
}

export async function loadPublishedSeries(id: string, signal?: AbortSignal): Promise<PublishedSeries> {
  if (!/^[a-z0-9.-]+$/.test(id)) throw new Error('Identificador de serie inválido');
  const response = await fetch(`/series/${id}.json`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Unable to load series ${id} (${response.status})`);
  return (await response.json()) as PublishedSeries;
}
