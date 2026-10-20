import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ChartsSection } from './components/home/ChartsSection';
import { SummaryCardsGrid } from './components/home/SummaryCardsGrid';
import { TimelineSection } from './components/home/TimelineSection';
import { FilterBar } from './components/layout/FilterBar';
import { Footer } from './components/layout/Footer';
import { TopNavbar } from './components/layout/TopNavbar';
import { DelayedSeriesModal } from './components/modals/DelayedSeriesModal';
import { useMonitorFilters } from './hooks/useMonitorFilters';
import { loadDashboardData } from './services/dataService';
import { IndicatorDetail } from './components/home/IndicatorDetail';
import type { DashboardData, Language } from './types/monitor.types';
import './index.css';

export default function App() {
  const detailId = window.location.pathname.match(/^\/indicador\/([a-z0-9.-]+)\/?$/)?.[1];
  if (detailId) return <IndicatorDetail id={detailId} />;
  return <HomeApp />;
}

function HomeApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    loadDashboardData(controller.signal)
      .then(setData)
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  if (!data) {
    if (error) {
      return (
        <main className="loading-shell">
          <div className="load-card load-card--error">
            <AlertTriangle size={19} />
            <p>Unable to load the demonstration files.</p>
            <button className="retry-button" type="button" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={14} />Try again</button>
          </div>
        </main>
      );
    }
    return <main className="loading-shell" aria-label="Loading"><span className="loading-spinner" /></main>;
  }

  return <MonitorDashboard data={data} />;
}

function MonitorDashboard({ data }: { data: DashboardData }) {
  const [filters, updateFilters] = useMonitorFilters(data.metadata);
  const [search, setSearch] = useState('');
  const [showDelayed, setShowDelayed] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem('monitor-chile-language') === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('monitor-chile-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const ui = data.metadata.ui[language];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.lang = language;
    try {
      localStorage.setItem('monitor-chile-theme', dark ? 'dark' : 'light');
      localStorage.setItem('monitor-chile-language', language);
    } catch {
      // The interface remains usable when browser storage is unavailable.
    }
  }, [dark, language]);

  useEffect(() => {
    if (!showDelayed) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; };
  }, [showDelayed]);

  const resultCount = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
    if (!term) return 0;
    const cards = data.summaries.cards.filter((card) => [card.title, card.titleEn, card.main.name, card.main.nameEn, ...card.subIndicators.flatMap((item) => [item.name, item.nameEn])]
      .join(' ').toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en').includes(term)).length;
    const events = data.timeline.events.filter((event) => [event.indicator, event.indicatorEn, event.source]
      .join(' ').toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en').includes(term)).length;
    const charts = data.charts.charts.filter((chart) => [chart.title, chart.titleEn, ...chart.series.flatMap((item) => [item.label, item.labelEn])]
      .join(' ').toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en').includes(term)).length;
    return cards + events + charts;
  }, [data, language, search]);

  return (
    <div className="app-frame">
      <TopNavbar
        metadata={data.metadata}
        ui={ui}
        language={language}
        dark={dark}
        search={search}
        onSearch={setSearch}
        resultCount={resultCount}
        onToggleLanguage={() => setLanguage((current) => current === 'es' ? 'en' : 'es')}
        onToggleTheme={() => setDark((current) => !current)}
        onShowDelayed={() => setShowDelayed(true)}
        cards={data.summaries.cards}
        charts={data.charts.charts}
      />

      <main className="page-shell main-content">
        <FilterBar metadata={data.metadata} ui={ui} language={language} filters={filters} onChange={updateFilters} />

        <TimelineSection
          events={data.timeline.events}
          category={filters.category}
          search={search}
          language={language}
          ui={ui}
        />

        <SummaryCardsGrid
          cards={data.summaries.cards}
          charts={data.charts.charts}
          from={filters.from}
          to={filters.to}
          metadata={data.metadata}
          language={language}
          variation={filters.variation}
          period={filters.period}
          category={filters.category}
          search={search}
          ui={ui}
          onChooseCategory={(category) => updateFilters({ category })}
        />

        <ChartsSection
          charts={data.charts.charts}
          metadata={data.metadata}
          language={language}
          variation={filters.variation}
          period={filters.period}
          from={filters.from}
          to={filters.to}
          category={filters.category}
          search={search}
          ui={ui}
        />
      </main>

      <Footer metadata={data.metadata} ui={ui} language={language} />
      {showDelayed ? <DelayedSeriesModal metadata={data.metadata} ui={ui} language={language} onClose={() => setShowDelayed(false)} /> : null}
    </div>
  );
}
