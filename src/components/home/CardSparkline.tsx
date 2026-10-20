import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { ChartDefinition, ChartPoint, Language, PeriodId, Variation } from '../../types/monitor.types';

interface CardSparklineProps {
  chart?: ChartDefinition;
  language: Language;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
}

function SparklineTooltip({
  active,
  payload,
  language,
  unit,
}: TooltipProps<number, string> & { language: Language; unit: string }) {
  if (!active || !payload?.length) return null;
  const item = payload.find((entry) => typeof entry.value === 'number' && Number.isFinite(entry.value));
  if (!item) return null;
  const observation = item.payload as ChartPoint;
  const periodLabel = language === 'en' ? observation.labelEn : observation.label;
  const value = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-CL', {
    maximumFractionDigits: 2,
  }).format(item.value as number);

  return (
    <div className="sparkline-tooltip">
      <span>{periodLabel}</span>
      <strong>{value}{unit}</strong>
    </div>
  );
}

/**
 * Present the FIRST series of the existing category chart, preserving its
 * values, gaps, frequency and data-status classification. No fabricated points.
 * Monotone is used solely for rendering between the actual observations.
 */
export function CardSparkline({ chart, language, variation, period, from, to }: CardSparklineProps) {
  const componentId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const series = chart?.series[0];

  if (!chart || !series) {
    return <p className="sparkline-unavailable">{language === 'en' ? 'History unavailable' : 'Historial no disponible'}</p>;
  }

  const dataKey = series.valuesByVariation[variation];
  const currentYear = String(new Date().getFullYear());
  const filtered = chart.data.filter((point) => {
    if (period === 'personalizado' && ((from && point.period < from) || (to && point.period > to))) return false;
    if (period === 'anio' && point.period.slice(0, 4) !== currentYear) return false;
    return true;
  });
  // Trim unpublished trailing periods but retain interior missing observations.
  const lastObservedIndex = filtered.findLastIndex((point) =>
    typeof point[dataKey] === 'number' && Number.isFinite(point[dataKey]));
  const history = filtered.slice(0, lastObservedIndex + 1).slice(-12);
  const validValues = history
    .map((point) => point[dataKey])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (validValues.length < 2) {
    return <p className="sparkline-unavailable">{language === 'en' ? 'Not enough observations' : 'Sin datos suficientes para mostrar una tendencia'}</p>;
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const pad = Math.max((max - min) * 0.16, Math.abs(max) * 0.012, 0.04);
  const priceBars = chart.category === 'precios';
  const domain: [number, number] = priceBars
    ? [Math.min(0, min - pad), Math.max(0, max + pad)]
    : [min - pad, max + pad];
  const gradientId = 'spark-gradient-' + componentId;
  const latest = history[history.length - 1];
  const latestValue = latest[dataKey] as number;
  const label = language === 'en' ? series.labelEn : series.label;
  const fromLabel = language === 'en' ? history[0].labelEn : history[0].label;
  const toLabel = language === 'en' ? latest.labelEn : latest.label;
  const description = (language === 'en' ? 'Historical observations for ' : 'Observaciones históricas de ')
    + label + ': ' + fromLabel + ' — ' + toLabel;

  const sharedAxes = (
    <>
      <XAxis dataKey="period" hide />
      <YAxis hide domain={domain} allowDataOverflow />
      <Tooltip
        isAnimationActive={false}
        cursor={false}
        content={<SparklineTooltip language={language} unit={chart.unit} />}
      />
    </>
  );

  return (
    <figure className={'card-sparkline card-sparkline--' + (priceBars ? 'bars' : 'area')} aria-label={description}>
      <div className="sparkline-plot">
        <ResponsiveContainer width="100%" height={82}>
          {priceBars ? (
            <BarChart data={history} margin={{ top: 7, right: 3, bottom: 3, left: 3 }}>
              {sharedAxes}
              <Bar dataKey={dataKey} maxBarSize={23} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {history.map((point, index) => (
                  <Cell key={point.period} fill={index === history.length - 1 ? 'var(--spark-highlight)' : 'var(--spark-bar-muted)'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={history} margin={{ top: 7, right: 6, bottom: 4, left: 2 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spark-line)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--spark-line)" stopOpacity={0.025} />
                </linearGradient>
              </defs>
              {sharedAxes}
              <Area
                dataKey={dataKey}
                type="monotone"
                stroke="var(--spark-line)"
                fill={'url(#' + gradientId + ')'}
                fillOpacity={1}
                strokeWidth={2.35}
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 1.5 }}
                baseValue={domain[0]}
                connectNulls={false}
                isAnimationActive={false}
              />
              <ReferenceDot
                x={latest.period}
                y={latestValue}
                r={3.75}
                fill="var(--spark-highlight)"
                stroke="var(--surface)"
                strokeWidth={1.5}
                ifOverflow="visible"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <figcaption className="visually-hidden">
        {description}. {language === 'en'
          ? 'The curve is a visual interpolation only; underlying observations are unchanged.'
          : 'La curva interpola visualmente entre puntos; las observaciones no fueron modificadas.'}
      </figcaption>
    </figure>
  );
}
