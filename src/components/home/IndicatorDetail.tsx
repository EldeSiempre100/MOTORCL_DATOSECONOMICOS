import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { loadPublishedSeries, type PublishedSeries } from '../../services/dataService';

function number(value: number) {
  return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function change(current: number, previous?: number) {
  if (previous === undefined) return 'No disponible';
  const difference = current - previous;
  return `${difference >= 0 ? '+' : ''}${number(difference)} pp`;
}

export function IndicatorDetail({ id }: { id: string }) {
  const [series, setSeries] = useState<PublishedSeries | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    loadPublishedSeries(id, controller.signal).then(setSeries).catch((cause: unknown) => {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setError(true);
    });
    return () => controller.abort();
  }, [id]);
  const chart = useMemo(() => series?.observations.slice(-36).map((item) => ({
    period: item.period, value: item.value,
  })) ?? [], [series]);

  function downloadCsv() {
    if (!series) return;
    const rows = ['periodo,desde,hasta,valor,publicado', ...series.observations.map((item) =>
      [item.period, item.observedFrom, item.observedTo, item.value, item.publishedAt ?? ''].join(','))];
    const url = URL.createObjectURL(new Blob([rows.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${series.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const latest = series?.observations.at(-1);
  const prior = series?.observations.at(-2);
  const yearAgo = series?.observations.find((item) => item.period === `${Number(latest?.period.slice(0, 4)) - 1}${latest?.period.slice(4)}`);

  return (
    <div className="app-frame">
      <header className="site-header"><div className="page-shell topbar"><a className="brand" href="/"><span className="brand-name">Monitor Chile</span></a><a className="text-link" href="/"><ArrowLeft size={15} /> Volver al monitor</a></div></header>
      <main className="page-shell main-content indicator-page">
        {error ? <div className="empty-state">No se pudo cargar esta serie.</div> : !series || !latest ? <div className="loading-shell"><span className="loading-spinner" /></div> : <>
          <p className="eyebrow">FICHA DE INDICADOR · {series.organization} · DATO OFICIAL</p>
          <h1>{series.name}</h1>
          <p className="indicator-lead">Encuesta Nacional de Empleo · tasa nacional, trimestre móvil. Código oficial: <code>{series.officialCode}</code></p>
          <div className="indicator-facts">
            <div><span>Último nivel</span><strong>{number(latest.value)}%</strong></div>
            <div><span>Período observado</span><strong>{latest.observedFrom} a {latest.observedTo}</strong></div>
            <div><span>Publicación</span><strong>{latest.publishedAt ?? 'Fecha no disponible en SIMEL'}</strong></div>
            <div><span>Consulta del sistema</span><strong>{series.lastSuccessfulRefresh.slice(0, 10)}</strong></div>
            <div><span>Próxima publicación</span><strong>Fecha oficial no verificada</strong></div>
          </div>
          <div className="indicator-facts indicator-facts--changes">
            <div><span>Cambio respecto al trimestre móvil anterior</span><strong>{change(latest.value, prior?.value)}</strong></div>
            <div><span>Cambio en doce meses</span><strong>{change(latest.value, yearAgo?.value)}</strong></div>
            <div><span>Acumulado anual</span><strong>No corresponde a una tasa de nivel</strong></div>
          </div>
          <section className="section-block" aria-labelledby="indicator-history">
            <div className="section-heading"><div><h2 id="indicator-history">Serie histórica</h2><p className="section-subtitle">Últimas 36 observaciones · valores originales del INE</p></div><button className="share-button" type="button" onClick={downloadCsv}><Download size={14} /> Descargar CSV</button></div>
            <div className="chart-card indicator-chart"><ResponsiveContainer width="100%" height={300}><LineChart data={chart} margin={{ top: 10, right: 18, bottom: 4, left: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} minTickGap={20} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" /><Tooltip formatter={(value) => [`${number(Number(value))}%`, 'Desocupación']} /><Line type="monotone" dataKey="value" stroke="#b57947" dot={false} strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>
          </section>
          <section className="section-block" aria-labelledby="indicator-observations">
            <div className="section-heading"><h2 id="indicator-observations">Observaciones por fecha</h2><span className="section-period">{series.observations.length} períodos conservados</span></div>
            <div className="indicator-table-wrap"><table className="indicator-table"><thead><tr><th>Período final</th><th>Desde</th><th>Hasta</th><th>Tasa</th><th>Publicación</th><th>Revisiones</th></tr></thead><tbody>{[...series.observations].reverse().map((item) => <tr key={item.period}><td>{item.period}</td><td>{item.observedFrom}</td><td>{item.observedTo}</td><td>{number(item.value)}%</td><td>{item.publishedAt ?? 'No informada'}</td><td>{item.revisions.length}</td></tr>)}</tbody></table></div>
          </section>
          <div className="indicator-sources"><a href={latest.documentUrl ?? series.methodologyUrl} target="_blank" rel="noreferrer">Publicación / metodología INE <ArrowUpRight size={13} /></a><a href={series.sourceUrl} target="_blank" rel="noreferrer">Serie original SIMEL <ArrowUpRight size={13} /></a></div>
        </>}
      </main>
    </div>
  );
}
