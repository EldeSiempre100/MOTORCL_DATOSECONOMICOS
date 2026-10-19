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

  return { metadata, timeline, summaries, charts };
}
