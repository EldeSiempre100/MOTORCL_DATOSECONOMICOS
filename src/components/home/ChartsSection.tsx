import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { AppMetadata, ChartDefinition, ChartPoint, Language, PeriodId, UIStrings, Variation } from '../../types/monitor.types';

interface ChartsSectionProps {
  charts: ChartDefinition[];
  metadata: AppMetadata;
  language: Language;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
  category: string;
  search: string;
  ui: UIStrings;
}

function selectPeriod(data: ChartPoint[], period: PeriodId, from: string, to: string): ChartPoint[] {
  if (period === 'anio') return data.filter((point) => point.period >= '2026-01');
  if (period === 'personalizado') {
    return data.filter((point) => (!from || point.period >= from) && (!to || point.period <= to));
  }
  if (period === 'ultimo-mes') {
    const complete = data.filter((point) => Object.entries(point).some(([key, value]) => key !== 'period' && key !== 'label' && key !== 'labelEn' && value !== null));
    return complete.slice(-12);
  }
  return data.slice(-12);
}

function ChartTooltip({ active, payload, label, language, chart, variation }: TooltipProps<number, string> & { language: Language; chart: ChartDefinition; variation: Variation }) {
  if (!active || !payload?.length) return null;
  const available = payload.filter((item) => item.value !== null && item.value !== undefined);
  if (!available.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="tooltip-period">{String(label ?? '')}</p>
      {available.map((item, index) => {
        const series = chart.series.find((candidate) => candidate.valuesByVariation[variation] === String(item.dataKey));
        return (
          <div className="tooltip-row" key={`${String(item.dataKey)}-${index}`}>
            <span className="tooltip-dot" style={{ backgroundColor: String(item.color ?? '#426f5d') }} />
            <span className="tooltip-name">{series ? (language === 'en' ? series.labelEn : series.label) : String(item.name ?? '')}</span>
            <strong>{new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', { maximumFractionDigits: 1 }).format(Number(item.value))}{chart.unit}</strong>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ chart, metadata, language, variation, period, from, to, ui }: {
  chart: ChartDefinition;
  metadata: AppMetadata;
  language: Language;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
  ui: UIStrings;
}) {
  const data = useMemo(() => selectPeriod(chart.data, period, from, to), [chart.data, period, from, to]);
  const missing = data.every((point) => chart.series.every((series) => point[series.valuesByVariation[variation]] === null));
  const periodLabel = language === 'en' ? chart.referenceEn : chart.reference;
  const leftAxis = language === 'en' ? chart.axes.leftEn : chart.axes.left;
  const rightAxis = language === 'en' ? chart.axes.rightEn : chart.axes.right;
  const hasRightAxis = chart.series.some((series) => series.axis === 'right');

  return (
    <article className="chart-card">
      <header className="chart-card-header">
        <div className="chart-card-title">
          <h3>{language === 'en' ? chart.titleEn : chart.title} <span className={`data-origin data-origin--${chart.dataStatus ?? 'demo'}`}>{chart.dataStatus === 'official' ? 'INE · oficial' : language === 'en' ? 'Example' : 'Ejemplo'}</span></h3>
          <p>{language === 'en' ? chart.subtitleEn : chart.subtitle}</p>
        </div>
        <span className="chart-unit">{chart.unit}</span>
      </header>
      <div className="chart-legend" aria-label={ui.seriesLabel}>
        {chart.series.map((series) => (
          <span className="legend-item" key={series.id}>
            <span className={`legend-mark legend-mark--${series.type}`} style={{ backgroundColor: series.color, borderColor: series.color }} />
            {language === 'en' ? series.labelEn : series.label}
          </span>
        ))}
      </div>

      {!missing && data.length ? (
        <div className="chart-plot">
          <div className="axis-caption axis-caption--left">{leftAxis}</div>
          <ResponsiveContainer width="100%" height={278}>
            <ComposedChart data={data} margin={{ top: 22, right: 2, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey={language === 'en' ? 'labelEn' : 'label'} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} minTickGap={18} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', { maximumFractionDigits: 1 }).format(value)} width={46} tickCount={5} />
              {hasRightAxis ? <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', { maximumFractionDigits: 1 }).format(value)} width={44} tickCount={5} /> : null}
              <ReferenceLine y={0} yAxisId="left" stroke="var(--chart-grid)" />
              <Tooltip content={<ChartTooltip language={language} chart={chart} variation={variation} />} cursor={{ fill: 'var(--chart-cursor)' }} />
              {chart.series.map((series) => {
                const dataKey = series.valuesByVariation[variation];
                return series.type === 'bar' ? (
                  <Bar key={series.id} dataKey={dataKey} yAxisId={series.axis} fill={series.color} radius={[3, 3, 0, 0]} maxBarSize={18} stackId={series.stackId} isAnimationActive={false} />
                ) : (
                  <Line key={series.id} dataKey={dataKey} yAxisId={series.axis} type="linear" stroke={series.color} strokeWidth={2} dot={false} activeDot={{ r: 3.5, strokeWidth: 0 }} connectNulls={false} isAnimationActive={false} />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
          {hasRightAxis && rightAxis ? <div className="axis-caption axis-caption--right">{rightAxis}</div> : null}
        </div>
      ) : (
        <div className="chart-empty">{ui.noData}</div>
      )}

      <footer className="chart-card-footer">
        <span>{ui.referencePeriod}: <strong>{periodLabel}</strong></span>
        <span className="chart-source-links">
          {chart.sourceIds.map((sourceId, index) => (
            <span key={sourceId}>{index ? <span className="source-divider">·</span> : null}{metadata.sources[sourceId] && chart.dataStatus === 'official' ? <a href={chart.documentUrl ?? metadata.sources[sourceId].url} target="_blank" rel="noreferrer">{sourceId}<ArrowUpRight size={10} /></a> : sourceId}</span>
          ))}
        </span>
        <p>{language === 'en' ? chart.footnoteEn : chart.footnote}</p>
        {chart.seriesId ? <p><a href={`/indicador/${chart.seriesId}`}>{language === 'en' ? 'See observations and download' : 'Ver observaciones y descarga'} <ArrowUpRight size={10} /></a></p> : null}
      </footer>
    </article>
  );
}

export function ChartsSection({ charts, metadata, language, variation, period, from, to, category, search, ui }: ChartsSectionProps) {
  const normalizedSearch = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
  const visibleCharts = charts.filter((chart) => {
    const matchesCategory = category === 'vision-general' || chart.category === category;
    const searchable = [chart.title, chart.titleEn, chart.subtitle, chart.subtitleEn, ...chart.series.flatMap((series) => [series.label, series.labelEn])]
      .join(' ')
      .toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
    return matchesCategory && (!normalizedSearch || searchable.includes(normalizedSearch));
  });

  return (
    <section className="section-block charts-section" id="series" aria-labelledby="charts-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{ui.chartKicker}</p>
          <h2 id="charts-heading">{ui.chartTitle}</h2>
          <p className="section-subtitle">{ui.chartSubtitle}</p>
        </div>
        <span className="section-period">{ui.variationLabel}: <strong>{ui.variations.find((option) => option.id === variation)?.label}</strong></span>
      </div>

      {visibleCharts.length ? (
        <div className="charts-grid">
          {visibleCharts.map((chart) => <ChartCard key={chart.id} chart={chart} metadata={metadata} language={language} variation={variation} period={period} from={from} to={to} ui={ui} />)}
        </div>
      ) : <div className="empty-state">{search.trim() ? ui.noSearchResults : ui.noCategoryCharts}</div>}
    </section>
  );
}
