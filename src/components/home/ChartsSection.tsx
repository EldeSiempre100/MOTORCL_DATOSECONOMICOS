import { useMemo, useState } from 'react';
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

type TimeRange = '1A' | '3A' | '5A' | 'Todo';

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

function selectPeriod(data: ChartPoint[], period: PeriodId, from: string, to: string, range: TimeRange): ChartPoint[] {
  const ordered = [...data].sort((a, b) => a.period.localeCompare(b.period));
  const latest = ordered.at(-1)?.period;
  if (!latest) return [];
  const year = latest.slice(0, 4);
  let base = ordered;
  if (period === 'anio') {
    base = base.filter(point => point.period >= year + '-01');
  } else if (period === 'personalizado') {
    // Month inputs must include every day of their ending month.
    base = base.filter(point => (!from || point.period.slice(0, 7) >= from) &&
      (!to || point.period.slice(0, 7) <= to));
  }
  if (range === 'Todo') return base;
  // A year is a calendar interval, NOT twelve arbitrary daily/monthly records.
  const distance = range === '1A' ? 1 : range === '3A' ? 3 : 5;
  const start = new Date(Date.UTC(Number(year) - distance, Number(latest.slice(5, 7)) - 1, Number(latest.slice(8, 10)) || 1));
  const lower = start.toISOString().slice(0, 10);
  return base.filter(point => (point.period.length === 7 ? point.period + '-01' : point.period) >= lower);
}

function ChartTooltip({
  active,
  payload,
  label,
  language,
  chart,
  variation,
}: TooltipProps<number, string> & { language: Language; chart: ChartDefinition; variation: Variation }) {
  if (!active || !payload?.length) return null;
  const available = payload.filter((item) => item.value !== null && item.value !== undefined);
  if (!available.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-period-header">
        <span className="tooltip-period">{String(label ?? '')}</span>
        <span className="tooltip-unit-tag">{chart.unit}</span>
      </div>
      <div className="tooltip-rows">
        {available.map((item, index) => {
          const series = chart.series.find((candidate) => candidate.valuesByVariation[variation] === String(item.dataKey));
          const color = String(item.color ?? series?.color ?? '#1b4985');
          return (
            <div className="tooltip-row" key={`${String(item.dataKey)}-${index}`}>
              <span className="tooltip-dot" style={{ backgroundColor: color }} />
              <span className="tooltip-name">
                {series ? (language === 'en' ? series.labelEn : series.label) : String(item.name ?? '')}
              </span>
              <strong className="tooltip-val dato">
                {new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                }).format(Number(item.value))}
                {chart.unit}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({
  chart,
  metadata,
  language,
  variation,
  period,
  from,
  to,
  ui,
}: {
  chart: ChartDefinition;
  metadata: AppMetadata;
  language: Language;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
  ui: UIStrings;
}) {
  const [range, setRange] = useState<TimeRange>(period === 'personalizado' ? 'Todo' : '1A');
  const data = useMemo(
    () => selectPeriod(chart.data, period, from, to, range),
    [chart.data, period, from, to, range]
  );
  const missing = data.every((point) => chart.series.every((series) => point[series.valuesByVariation[variation]] === null));
  const periodLabel = language === 'en' ? chart.referenceEn : chart.reference;
  const leftAxis = language === 'en' ? chart.axes.leftEn : chart.axes.left;
  const rightAxis = language === 'en' ? chart.axes.rightEn : chart.axes.right;
  const hasRightAxis = chart.series.some((series) => series.axis === 'right');
  const isOfficial = chart.dataStatus === 'official';

  return (
    <article className={`chart-card ${isOfficial ? 'es-reciente' : ''}`} id={`chart-${chart.id}`}>
      <header className="chart-card-header">
        <div className="chart-card-title">
          <div className="chart-title-row">
            <h3>{language === 'en' ? chart.titleEn : chart.title}</h3>
            <span className={`data-origin data-origin--${chart.dataStatus ?? 'demo'}`}>
              <span className={`status-dot status-dot--${isOfficial ? 'green' : 'gray'}`} />
              {isOfficial ? 'INE · Oficial' : (chart.dataStatus === 'sourced' ? 'Mindicador · fuente externa' : '')}
            </span>
          </div>
          <p>{language === 'en' ? chart.subtitleEn : chart.subtitle}</p>
        </div>

        <div className="chart-card-actions">
          <div className="rangos" role="group" aria-label="Rango temporal">
            {(['1A', '3A', '5A', 'Todo'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className="rango-btn"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="chart-unit">{chart.unit}</span>
        </div>
      </header>

      <div className="chart-legend" aria-label={ui.seriesLabel}>
        {chart.series.map((series) => (
          <span className="legend-item" key={series.id}>
            <span
              className={`legend-mark legend-mark--${series.type}`}
              style={{ backgroundColor: series.color, borderColor: series.color }}
            />
            {language === 'en' ? series.labelEn : series.label}
          </span>
        ))}
      </div>

      {!missing && data.length ? (
        <div className="chart-plot">
          <div className="axis-caption axis-caption--left">{leftAxis}</div>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={data} margin={{ top: 22, right: 6, left: -4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey={language === 'en' ? 'labelEn' : 'label'}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--f-mono)' }}
                minTickGap={16}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--f-mono)' }}
                tickFormatter={(val: number) =>
                  new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', {
                    maximumFractionDigits: 1,
                  }).format(val)
                }
                width={44}
                tickCount={5}
              />
              {hasRightAxis ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--f-mono)' }}
                  tickFormatter={(val: number) =>
                    new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-US', {
                      maximumFractionDigits: 1,
                    }).format(val)
                  }
                  width={42}
                  tickCount={5}
                />
              ) : null}
              <ReferenceLine y={0} yAxisId="left" stroke="var(--border-strong)" strokeWidth={1} />
              <Tooltip
                content={<ChartTooltip language={language} chart={chart} variation={variation} />}
                cursor={{ stroke: 'var(--chart-cursor)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              {chart.series.map((series) => {
                const dataKey = series.valuesByVariation[variation];
                return series.type === 'bar' ? (
                  <Bar
                    key={series.id}
                    dataKey={dataKey}
                    yAxisId={series.axis}
                    fill={series.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={16}
                    stackId={series.stackId}
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    key={series.id}
                    dataKey={dataKey}
                    yAxisId={series.axis}
                    type="monotone"
                    stroke={series.color}
                    strokeWidth={2.4}
                    dot={false}
                    activeDot={{ r: 4.5, stroke: 'var(--surface)', strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
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
        <div className="chart-footer-meta">
          <span>{ui.referencePeriod}: <strong>{periodLabel}</strong></span>
          <span className="chart-source-links">
            {chart.sourceIds.map((sourceId, index) => (
              <span key={sourceId}>
                {index ? <span className="source-divider">·</span> : null}
                {metadata.sources[sourceId] && (chart.dataStatus === 'official' || chart.dataStatus === 'sourced') ? (
                  <a href={chart.documentUrl ?? metadata.sources[sourceId].url} target="_blank" rel="noreferrer">
                    {sourceId}
                    <ArrowUpRight size={10} />
                  </a>
                ) : (
                  sourceId
                )}
              </span>
            ))}
          </span>
        </div>
        <p className="chart-footnote">{language === 'en' ? chart.footnoteEn : chart.footnote}</p>
        {chart.seriesId ? (
          <div className="chart-footer-cta">
            <a href={`/indicador/${chart.seriesId}`} className="chart-detail-btn">
              <span>{language === 'en' ? 'Open indicator sheet' : 'Ver ficha y descarga CSV'}</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

export function ChartsSection({
  charts,
  metadata,
  language,
  variation,
  period,
  from,
  to,
  category,
  search,
  ui,
}: ChartsSectionProps) {
  const normalizedSearch = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
  const visibleCharts = charts.filter((chart) => {
    const matchesCategory = category === 'vision-general' || chart.category === category;
    const searchable = [
      chart.title,
      chart.titleEn,
      chart.subtitle,
      chart.subtitleEn,
      ...chart.series.flatMap((series) => [series.label, series.labelEn]),
    ]
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
        <span className="section-period">
          {ui.variationLabel}: <strong>{ui.variations.find((option) => option.id === variation)?.label}</strong>
        </span>
      </div>

      {visibleCharts.length ? (
        <div className="charts-grid">
          {visibleCharts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              metadata={metadata}
              language={language}
              variation={variation}
              period={period}
              from={from}
              to={to}
              ui={ui}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">{search.trim() ? ui.noSearchResults : ui.noCategoryCharts}</div>
      )}
    </section>
  );
}
