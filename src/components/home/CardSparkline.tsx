import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis, type TooltipProps } from 'recharts';
import type { ChartDefinition, Language, PeriodId, Variation } from '../../types/monitor.types';

interface CardSparklineProps {
  chart?: ChartDefinition;
  language: Language;
  variation: Variation;
  period: PeriodId;
  from: string;
  to: string;
}

function SparklineTooltip({ active, payload, language, unit }: TooltipProps<number, string> & { language: Language; unit: string }) {
  if (!active || !payload?.length || typeof payload[0].value !== 'number') return null;
  const point = payload[0].payload as { label?: string; labelEn?: string };
  const periodText = language === 'en' ? point.labelEn : point.label;
  const number = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-CL', { maximumFractionDigits: 2 }).format(payload[0].value);
  return (
    <div className="sparkline-tooltip">
      <span>{periodText ?? ''}</span>
      <strong>{number}{unit}</strong>
    </div>
  );
}

/**
 * A compact view of an existing chart's PRIMARY series. It never constructs
 * synthetic history from the summary KPI or mixes different units/axes.
 */
export function CardSparkline({ chart, language, variation, period, from, to }: CardSparklineProps) {
  const series = chart?.series[0];
  if (!chart || !series) return <p className="sparkline-unavailable">{language === 'en' ? 'Historical data not available' : 'Historial no disponible'}</p>;

  const key = series.valuesByVariation[variation];
  const history = chart.data
    .filter((point) => {
      const value = point[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      if (period === 'personalizado' && ((from && point.period < from) || (to && point.period > to))) return false;
      if (period === 'anio' && point.period.slice(0, 4) !== String(new Date().getFullYear())) return false;
      return true;
    })
    .slice(-12);

  if (history.length < 2) {
    return <p className="sparkline-unavailable">{language === 'en' ? 'Not enough comparable observations' : 'Sin observaciones suficientes para una tendencia'}</p>;
  }

  const values = history.map((point) => point[key] as number);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.15, Math.abs(high) * 0.015, 0.05);
  const latest = history[history.length - 1];
  const first = history[0];
  const label = language === 'en' ? series.labelEn : series.label;
  const firstPeriod = language === 'en' ? first.labelEn : first.label;
  const lastPeriod = language === 'en' ? latest.labelEn : latest.label;

  return (
    <figure className="card-sparkline" aria-label={(language === 'en' ? 'Historical trend for ' : 'Tendencia histórica de ') + label + ': ' + firstPeriod + ' — ' + lastPeriod}>
      <div className="sparkline-header">
        <span>{language === 'en' ? 'Trend' : 'Tendencia'} · {history.length} {language === 'en' ? 'observations' : 'observaciones'}</span>
        <span>{firstPeriod} — {lastPeriod}</span>
      </div>
      <div className="sparkline-plot">
        <ResponsiveContainer width="100%" height={76}>
          <LineChart data={history} margin={{ top: 8, right: 5, bottom: 5, left: 5 }}>
            <YAxis hide domain={[low - padding, high + padding]} />
            <Tooltip isAnimationActive={false} content={<SparklineTooltip language={language} unit={chart.unit} />} />
            <Line dataKey={key} type="linear" stroke={series.color} strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="visually-hidden">{language === 'en' ? 'Chart displays actual recorded points for the selected variation; vertical scale is adjusted to show the trend.' : 'El gráfico muestra puntos registrados para la variación seleccionada; la escala vertical se ajusta para mostrar la tendencia.'}</figcaption>
    </figure>
  );
}
