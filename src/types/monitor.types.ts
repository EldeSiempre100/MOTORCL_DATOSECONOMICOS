export type Language = 'es' | 'en';
export type Variation = 'mensual' | 'interanual';
export type PeriodId = 'ultimo' | 'ultimo-mes' | 'anio' | '12-meses' | 'personalizado';
export type Tone = 'positive' | 'negative' | 'neutral';
export type DataStatus = 'official' | 'demo' | 'unavailable';
export interface Traceable {
  dataStatus?: DataStatus;
  seriesId?: string;
  sourceUrl?: string;
  documentUrl?: string;
  publishedAt?: string | null;
}

export interface FilterOption { id: string; label: string; }

export interface UIStrings {
  [key: string]: unknown;
  brandTagline: string;
  navMonitor: string;
  navData: string;
  navContact: string;
  searchPlaceholder: string;
  searchLabel: string;
  clearSearch: string;
  languageLabel: string;
  themeToDark: string;
  themeToLight: string;
  demoTag: string;
  cutLabel: string;
  delayedPrefix: string;
  delayedTitle: string;
  delayedIntro: string;
  close: string;
  filtersLabel: string;
  categoryLabel: string;
  variationLabel: string;
  periodLabel: string;
  categories: FilterOption[];
  variations: FilterOption[];
  periods: FilterOption[];
  latestData: string;
  lastCompleteSuffix: string;
  fromDate: string;
  toDate: string;
  shareView: string;
  viewCopied: string;
  copyError: string;
  timelineTitle: string;
  calendar: string;
  released: string;
  upcoming: string;
  today: string;
  recentRelease: string;
  upcomingRelease: string;
  summaryTitle: string;
  summaryKicker: string;
  chartTitle: string;
  chartKicker: string;
  chartSubtitle: string;
  sources: string;
  sourceData: string;
  periodContext: string;
  seriesLabel: string;
  noCategoryCards: string;
  noCategoryCharts: string;
  noSearchResults: string;
  noTimelineResults: string;
  marketExpected: string;
  releasedOn: string;
  indicator: string;
  referencePeriod: string;
  unit: string;
  updated: string;
  download: string;
  footerAboutTitle: string;
  footerAbout: string;
  footerSourcesTitle: string;
  footerMethodTitle: string;
  footerMethod: string;
  footerCredits: string;
  noData: string;
  monthNames: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  loading: string;
  loadError: string;
  retry: string;
  results: string;
  footerLinksTitle: string;
  mockSnapshot: string;
}

export interface SourceInfo { url: string; displayName: string; displayNameEn: string; }
export interface DelayedSeries {
  id: string; name: string; nameEn: string; source: string; lastUpdate: string; reason: string; reasonEn: string;
}
export interface AppMetadata {
  schemaVersion: number;
  projectName: string;
  status: string;
  updatedAt: string;
  asOfLabel: string;
  asOfLabelEn: string;
  latestCompleteMonth: string;
  latestCompleteMonthEn: string;
  isDemo: boolean;
  demoNotice: Record<Language, string>;
  delayedSeriesCount: number;
  delayedSeries: DelayedSeries[];
  sources: Record<string, SourceInfo>;
  ui: Record<Language, UIStrings>;
}

export interface TimelineEvent extends Traceable {
  id: string; status: 'published' | 'upcoming'; date: string; dateText: string; dateTextEn: string; category: string;
  indicator: string; indicatorEn: string; period: string; periodEn: string; value?: string; source: string; tone: Tone; icon: string;
}
export interface TimelineData { schemaVersion: number; events: TimelineEvent[]; }
export interface PeriodValue { value: string; tone: Tone; diagnosis: string; diagnosisEn: string; context: string; contextEn: string; }
export interface MainIndicator {
  name: string; nameEn: string; description: string; descriptionEn: string;
  valuesByVariation: Record<Variation, Record<PeriodId, PeriodValue>>;
}
export interface SubIndicator {
  name: string; nameEn: string; period: string; periodEn: string; values: Record<Variation, string>; toneByVariation: Record<Variation, Tone>;
}
export interface SummaryCard extends Traceable {
  id: string; category: string; title: string; titleEn: string; icon: string; main: MainIndicator; subIndicators: SubIndicator[]; sources: string[];
}
export interface SummaryCardsData { schemaVersion: number; cards: SummaryCard[]; }
export interface ChartSeries {
  id: string; label: string; labelEn: string; type: 'line' | 'bar'; axis: 'left' | 'right'; color: string;
  stackId?: string; valuesByVariation: Record<Variation, string>;
}
export interface ChartPoint { period: string; label: string; labelEn: string; [key: string]: string | number | null; }
export interface ChartDefinition extends Traceable {
  id: string; category: string; title: string; titleEn: string; subtitle: string; subtitleEn: string; unit: string;
  sourceIds: string[]; reference: string; referenceEn: string; footnote: string; footnoteEn: string;
  axes: { left: string; leftEn: string; right: string; rightEn: string; }; series: ChartSeries[]; data: ChartPoint[];
}
export interface ChartsData { schemaVersion: number; charts: ChartDefinition[]; }
export interface DashboardData { metadata: AppMetadata; timeline: TimelineData; summaries: SummaryCardsData; charts: ChartsData; }
