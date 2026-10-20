import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  Download,
  Info,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { loadPublishedSeries, type PublishedSeries } from '../../services/dataService';

type DetailTimeRange = '1A' | '2A' | '5A' | 'Todo';

function number(value: number, unit = 'percent') {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: unit === 'clp' ? 2 : 1,
    maximumFractionDigits: unit === 'clp' ? 2 : 1,
  }).format(value);
}

function change(current: number, previous: number | undefined, unit: string) {
  if (previous === undefined) return 'No disponible';
  const difference = current - previous;
  const isZero = Math.abs(difference) < 0.001;
  const sign = isZero ? '' : difference > 0 ? '+' : '';
  return unit === 'clp' ? sign + '$' + number(difference, unit) : sign + number(difference, unit) + ' pp';
}

function changeTone(current: number, previous: number | undefined, isUnemployment: boolean): 'positive' | 'negative' | 'neutral' {
  if (!isUnemployment || previous === undefined) return 'neutral';
  const diff = current - previous;
  // For unemployment, an increase is unfavorable (negative tone) and decrease is favorable (positive tone)
  if (diff < -0.05) return 'positive';
  if (diff > 0.05) return 'negative';
  return 'neutral';
}

export function IndicatorDetail({ id }: { id: string }) {
  const [series, setSeries] = useState<PublishedSeries | null>(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<DetailTimeRange>('2A');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    const controller = new AbortController();
    loadPublishedSeries(id, controller.signal)
      .then(setSeries)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const t = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [copyState]);

  const observations = series?.observations ?? [];
  const latest = observations.at(-1);
  const prior = observations.at(-2);
  const yearAgo = observations.find(
    (item) => item.period === `${Number(latest?.period.slice(0, 4)) - 1}${latest?.period.slice(4)}`
  );

  const filteredObservations = useMemo(() => {
    if (!observations.length) return [];
    if (range === '1A') return observations.slice(-12);
    if (range === '2A') return observations.slice(-24);
    if (range === '5A') return observations.slice(-60);
    return observations;
  }, [observations, range]);

  const chartData = useMemo(() => {
    return filteredObservations.map((item) => ({
      period: item.period,
      value: item.value,
      observedRange: `${item.observedFrom} — ${item.observedTo}`,
      publishedAt: item.publishedAt,
    }));
  }, [filteredObservations]);

  function downloadCsv() {
    if (!series) return;
    const rows = [
      ['periodo', 'desde', 'hasta', series.unit === 'clp' ? 'valor_clp' : 'tasa_porcentaje', 'publicado_at', 'fuente_estado'].join(','),
      ...series.observations.map((item) =>
        [
          item.period,
          item.observedFrom,
          item.observedTo,
          item.value.toFixed(2),
          item.publishedAt ?? '',
          item.sourceStatus ?? 'vigente',
        ].join(',')
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${series.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      // fallback
    }
  }

  const latestValue = latest?.value ?? 0;
  const unit = series?.unit ?? 'percent';
  const isOfficialIne = series?.organization === 'INE' && !series?.sourceProvider;
  const momChange = change(latestValue, prior?.value, unit);
  const momTone = changeTone(latestValue, prior?.value, isOfficialIne);
  const yoyChange = change(latestValue, yearAgo?.value, unit);
  const yoyTone = changeTone(latestValue, yearAgo?.value, isOfficialIne);

  return (
    <div className="app-frame">
      <header className="site-header" id="monitor-top">
        <div className="page-shell topbar">
          <a className="brand" href="/">
            <span className="brand-name">MotorCL</span>
          </a>
          <nav className="header-breadcrumbs" aria-label="Migas de pan">
            <a href="/" className="breadcrumb-link">Monitor</a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{isOfficialIne ? 'Empleo' : series?.category === 'tasas' ? 'Tasas' : 'Dólar y UF'}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{series?.name ?? 'Ficha'}</span>
          </nav>
          <a className="text-link back-link" href="/">
            <ArrowLeft size={15} /> Volver al monitor
          </a>
        </div>
      </header>

      <main className="page-shell main-content indicator-page">
        {error ? (
          <div className="empty-state">No se pudo cargar la serie solicitada.</div>
        ) : !series || !latest ? (
          <div className="loading-shell">
            <span className="loading-spinner" />
          </div>
        ) : (
          <>
            <div className="indicator-hero">
              <div className="indicator-hero-header">
                <div className="indicator-badges">
                  <span className={isOfficialIne ? 'status-badge status-badge--official' : 'status-badge'}>
                    <span className="status-dot status-dot--green" />
                    {isOfficialIne ? 'Fuente oficial · INE/SIMEL' : 'Datos intermediados · Mindicador'}
                  </span>
                  <span className="freshness-badge">Dato: {latest.period}</span>
                  {series.officialCode ? <span className="official-code">Código: <code>{series.officialCode}</code></span> : null}
                </div>
                <h1 className="indicator-title">{series.name}</h1>
                <p className="indicator-lead">
                  {isOfficialIne ? 'Encuesta Nacional de Empleo (ENE), INE. Tasa nacional por trimestre móvil, expresada como nivel.' : 'Serie diaria facilitada por Mindicador, intermediario que atribuye los datos al BCCh. Las fechas son de observación, no de publicación oficial.'}
                </p>
              </div>

              <div className="indicator-actions-bar">
                <button className="boton boton-primario" type="button" onClick={downloadCsv}>
                  <Download size={14} /> Descargar serie CSV
                </button>
                <button className="boton boton-secundario" type="button" onClick={copyLink}>
                  {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copyState === 'copied' ? 'Enlace copiado' : 'Compartir ficha'}</span>
                </button>
                <a
                  className="boton boton-secundario"
                  href={latest.documentUrl ?? series.methodologyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {isOfficialIne ? 'Metodología INE' : 'Banco Central de Chile'} <ArrowUpRight size={13} />
                </a>
                <a
                  className="boton boton-secundario"
                  href={series.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {isOfficialIne ? 'SIMEL SDMX' : 'Mindicador API'} <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="indicator-facts-grid">
              <div className="indicator-fact-card indicator-fact-card--primary">
                <span className="fact-label">Último nivel observado</span>
                <strong className="fact-value dato">{unit === 'clp' ? '$' : ''}{number(latest.value, unit)}{unit === 'percent' ? '%' : ''}</strong>
                <span className="fact-sub">{isOfficialIne ? 'Trimestre móvil ' : 'Fecha: '}{latest.observedFrom}{latest.observedFrom !== latest.observedTo ? ' a ' + latest.observedTo : ''}</span>
              </div>

              <div className="indicator-fact-card">
                <span className="fact-label">Variación período anterior</span>
                <strong className={`fact-value dato tone-${momTone}`}>{momChange}</strong>
                <span className="fact-sub">Respecto a la observación anterior</span>
              </div>

              <div className="indicator-fact-card">
                <span className="fact-label">Diferencia frente a igual fecha del año anterior</span>
                <strong className={`fact-value dato tone-${yoyTone}`}>{yoyChange}</strong>
                <span className="fact-sub">Mismo trimestre del año anterior</span>
              </div>

              <div className="indicator-fact-card">
                <span className="fact-label">Última ingesta exitosa</span>
                <strong className="fact-value fact-value--small dato">
                  {series.lastSuccessfulRefresh.slice(0, 10)}
                </strong>
                <span className="fact-sub">Motor de datos {isOfficialIne ? 'INE/SIMEL' : 'Mindicador'}</span>
              </div>
            </div>

            {/* Next release notice card (inspired by Monitor Argy) */}
            <div className="calendar-alert-card">
              <div className="calendar-alert-icon">
                <Calendar size={18} />
              </div>
              <div className="calendar-alert-body">
                <h3 className="calendar-alert-title">Calendario de publicación oficial</h3>
                <p className="calendar-alert-text">
                  El Instituto Nacional de Estadísticas (INE) publica los resultados de la Encuesta Nacional de Empleo
                  el último día hábil de cada mes a las 09:00 horas.
                </p>
              </div>
              <a
                className="calendar-alert-link"
                href={series.methodologyUrl}
                target="_blank"
                rel="noreferrer"
              >
                {isOfficialIne ? 'Calendario INE' : 'Ver fuente de origen'} <ArrowUpRight size={13} />
              </a>
            </div>

            {/* Interactive Full Chart */}
            <section className="section-block" aria-labelledby="indicator-chart-heading">
              <div className="section-heading">
                <div>
                  <h2 id="indicator-chart-heading">Serie histórica oficial</h2>
                  <p className="section-subtitle">
                    {filteredObservations.length} observaciones ({series.frequency === 'daily' ? 'frecuencia diaria' : 'trimestres móviles'})
                  </p>
                </div>
                <div className="rangos" role="group" aria-label="Rango de gráfico">
                  {(['1A', '2A', '5A', 'Todo'] as const).map((r) => (
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
              </div>

              <div className="chart-card indicator-chart-panel">
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={chartData} margin={{ top: 16, right: 18, bottom: 8, left: -6 }}>
                    <defs>
                      <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--acento)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}
                      minTickGap={20}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}
                      unit={unit === 'clp' ? ' CLP' : '%'}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                    />
                    
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const pt = payload[0];
                        return (
                          <div className="chart-tooltip">
                            <span className="tooltip-period">Período {label}</span>
                            <div className="tooltip-row">
                              <span className="tooltip-dot" style={{ backgroundColor: 'var(--acento)' }} />
                              <span className="tooltip-name">{series.name}</span>
                              <strong className="tooltip-val dato">{unit === 'clp' ? '$' : ''}{number(Number(pt.value), unit)}{unit === 'percent' ? '%' : ''}</strong>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--acento)"
                      strokeWidth={2.6}
                      fill="url(#detailGradient)"
                      activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    {latest ? (
                      <ReferenceDot
                        x={latest.period}
                        y={latest.value}
                        r={4.5}
                        fill="var(--acento)"
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    ) : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Observations Table */}
            <section className="section-block" aria-labelledby="observations-heading">
              <div className="section-heading">
                <div>
                  <h2 id="observations-heading">Registro de observaciones y revisiones</h2>
                  <p className="section-subtitle">
                    Datos conservados del motor {isOfficialIne ? 'INE/SIMEL' : 'Mindicador'}, sin alterar observaciones
                  </p>
                </div>
                <span className="section-period">
                  Total: {observations.length} observaciones registradas
                </span>
              </div>

              <div className="indicator-table-wrap">
                <table className="indicator-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th>{series.name}</th>
                      <th>Publicado</th>
                      <th>Revisiones detectadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...observations].reverse().map((item) => (
                      <tr key={item.period}>
                        <td className="dato"><strong>{item.period}</strong></td>
                        <td className="dato">{item.observedFrom}</td>
                        <td className="dato">{item.observedTo}</td>
                        <td className="dato">
                          <span className="table-rate-pill">{unit === 'clp' ? '$' : ''}{number(item.value, unit)}{unit === 'percent' ? '%' : ''}</span>
                        </td>
                        <td>{item.publishedAt ?? 'No informada en SDMX'}</td>
                        <td>
                          {item.revisions.length > 0 ? (
                            <span className="revisions-badge">{item.revisions.length}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Methodological footnote */}
            <footer className="indicator-detail-footer">
              <div className="methodology-note">
                <Info size={16} />
                <p>
                  Esta serie es adquirida de forma no comercial directamente desde el repositorio oficial SIMEL del
                  Instituto Nacional de Estadísticas de Chile bajo la licencia de datos abiertos del Estado de Chile.
                  Las cifras se conservan en su definición original sin interpolaciones destructivas.
                </p>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
