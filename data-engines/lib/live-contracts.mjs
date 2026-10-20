import { buildContracts } from './contracts.mjs';

const es = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function monthLabel(date) {
  const parts = date.slice(0, 10).split('-');
  return parts[2] ? parts[2] + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0] :
    months[Number(parts[1]) - 1] + ' ' + parts[0];
}
function valueText(point, spec) {
  return spec.unit === 'percent' ? es.format(point.value) + '%' : '$' + money.format(point.value);
}
function changeText(point, previous, spec) {
  if (!previous) return '—';
  const delta = point.value - previous.value;
  const sign = delta > 0 ? '+' : '';
  return sign + (spec.unit === 'percent' ? es.format(delta) + ' pp' : '$' + money.format(delta));
}
function contextFor(latest, previous, spec) {
  return monthLabel(latest.period) + ' · dato del ' + latest.period +
    (previous ? ' · variación desde el ' + previous.period + ': ' + changeText(latest, previous, spec) : '') +
    ' · vía Mindicador';
}
function cardValue(latest, previous, spec) {
  const context = contextFor(latest, previous, spec);
  return {
    value: valueText(latest, spec), tone: 'neutral',
    diagnosis: changeText(latest, previous, spec),
    diagnosisEn: changeText(latest, previous, spec),
    context, contextEn: context,
  };
}
function unavailable(description) {
  return {
    value: '—', tone: 'neutral', diagnosis: 'Sin cálculo', diagnosisEn: 'Not calculated',
    context: description, contextEn: description,
  };
}
function values(series, spec) {
  const o = series.observations;
  const last = o.at(-1), previous = o.at(-2);
  const firstThisYear = o.find(point => point.period.startsWith(last.period.slice(0, 4)));
  const previousYear = o.filter(p => p.period <= (Number(last.period.slice(0, 4)) - 1) + last.period.slice(4)).at(-1);
  const set = {
    ultimo: cardValue(last, previous, spec),
    'ultimo-mes': cardValue(last, previous, spec),
    anio: cardValue(last, firstThisYear && firstThisYear.period !== last.period ? firstThisYear : undefined, spec),
    '12-meses': previousYear ? cardValue(last, previousYear, spec) : unavailable('Sin histórico anual comparable'),
    personalizado: unavailable('Seleccione el rango de fechas en el gráfico histórico'),
  };
  return { mensual: structuredClone(set), interanual: structuredClone(set) };
}
function latestRecord(series) {
  const latest = series.observations.at(-1);
  if (!latest || !Number.isFinite(latest.value)) throw new Error('Serie sin último dato numérico ' + series.id);
  return latest;
}
function sourceLabel(series) {
  return series.sourceProvider === 'Mindicador' ? 'Mindicador' : series.organization;
}
function chartData(series, key) {
  return series.observations.slice(-365).map(item => ({
    period: item.period, label: monthLabel(item.period), labelEn: item.period, [key]: item.value,
  }));
}

export function buildLiveContracts(baseline, ineSeries, providerEntries, checkedAt, failures = []) {
  const result = buildContracts(baseline, ineSeries, checkedAt);
  const { metadata, timeline, summaries, charts } = result;

  // Never serve fictitious observations, expected values or publication dates.
  summaries.cards = summaries.cards.filter(card => card.dataStatus === 'official');
  charts.charts = charts.charts.filter(chart => chart.dataStatus === 'official');
  timeline.events = timeline.events.filter(event => event.dataStatus === 'official');

  const currency = providerEntries.filter(entry => ['dolar', 'uf'].includes(entry.spec.code));
  const tpm = providerEntries.find(entry => entry.spec.code === 'tpm');
  for (const entry of providerEntries) {
    const { spec, series } = entry;
    latestRecord(series);
    metadata.sources[sourceLabel(series)] = {
      url: series.sourceUrl,
      displayName: 'Mindicador (intermediario, datos de origen BCCh)',
      displayNameEn: 'Mindicador (third-party mirror, underlying BCCh data)',
    };
    // A sourced observation is distinct from the INE/BCCh official source endpoint.
    metadata.status = 'live';
    const isTpm = spec.code === 'tpm';
    const isDolar = spec.code === 'dolar';
    const title = isTpm ? 'Tasa de Política Monetaria' : 'Dólar y UF';
    const titleEn = isTpm ? 'Monetary policy rate' : 'Dollar and UF';
    if (!isTpm && !isDolar) continue;
    summaries.cards.push({
      id: isTpm ? 'tpm-vigente' : 'dolar-uf-vigente',
      category: spec.category,
      title, titleEn,
      icon: isTpm ? 'activity' : 'prices',
      dataStatus: 'sourced',
      seriesId: series.id,
      sourceUrl: series.sourceUrl,
      main: {
        name: spec.name, nameEn: spec.nameEn,
        description: isTpm ? 'Nivel vigente (%)' : 'Pesos chilenos por dólar observado',
        descriptionEn: isTpm ? 'Current rate level (%)' : 'Chilean pesos per observed US dollar',
        valuesByVariation: values(series, spec),
      },
      subIndicators: !isTpm && currency.find(x => x.spec.code === 'uf') ? [
        {
          name: 'Unidad de Fomento (UF)', nameEn: 'UF',
          seriesId: currency.find(x => x.spec.code === 'uf').series.id,
          period: monthLabel(latestRecord(currency.find(x => x.spec.code === 'uf').series).period),
          periodEn: latestRecord(currency.find(x => x.spec.code === 'uf').series).period,
          values: {
            mensual: valueText(latestRecord(currency.find(x => x.spec.code === 'uf').series), currency.find(x => x.spec.code === 'uf').spec),
            interanual: valueText(latestRecord(currency.find(x => x.spec.code === 'uf').series), currency.find(x => x.spec.code === 'uf').spec),
          },
          toneByVariation: { mensual: 'neutral', interanual: 'neutral' },
        },
      ] : [],
      sources: ['Mindicador'],
    });
  }

  if (currency.length) {
    const dollar = currency.find(x => x.spec.code === 'dolar');
    const uf = currency.find(x => x.spec.code === 'uf');
    const primary = dollar ?? uf;
    const byPeriod = new Map();
    for (const entry of currency) {
      const key = entry.spec.code + 'Clp';
      for (const item of chartData(entry.series, key)) {
        const existing = byPeriod.get(item.period) ?? { period: item.period, label: item.label, labelEn: item.labelEn };
        existing[key] = item[key];
        byPeriod.set(item.period, existing);
      }
    }
    charts.charts.push({
      id: 'dolar-uf-vigente', category: 'dolar-uf',
      title: 'Dólar observado y Unidad de Fomento', titleEn: 'Observed dollar and UF',
      subtitle: 'Niveles diarios en pesos chilenos; escalas independientes',
      subtitleEn: 'Daily levels in Chilean pesos; separate axes',
      dataStatus: 'sourced',
      seriesId: primary.series.id,
      sourceUrl: primary.series.sourceUrl,
      unit: 'CLP', sourceIds: ['Mindicador'],
      reference: monthLabel(primary.series.observations[0].period) + ' — ' + monthLabel(latestRecord(primary.series).period),
      referenceEn: primary.series.observations[0].period + ' — ' + latestRecord(primary.series).period,
      footnote: 'Mindicador es un intermediario de datos con origen atribuido al BCCh; no es el endpoint oficial. Sin fechas de publicación inferidas.',
      footnoteEn: 'Mindicador is a third-party mirror attributing BCCh data; it is not an official endpoint. Release dates are not inferred.',
      axes: {
        left: 'Dólar (CLP)', leftEn: 'Dollar (CLP)',
        right: 'UF (CLP)', rightEn: 'UF (CLP)',
      },
      series: currency.map(entry => ({
        id: entry.series.id,
        label: entry.spec.name, labelEn: entry.spec.nameEn,
        type: 'line',
        axis: entry.spec.code === 'uf' && dollar ? 'right' : 'left',
        color: entry.spec.code === 'uf' ? '#b57947' : '#3b866e',
        valuesByVariation: { mensual: entry.spec.code + 'Clp', interanual: entry.spec.code + 'Clp' },
      })),
      data: [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period)).slice(-365),
    });
  }

  if (tpm) {
    charts.charts.push({
      id: 'tpm-vigente', category: 'tasas',
      title: 'Tasa de Política Monetaria', titleEn: 'Monetary policy rate',
      subtitle: 'Nivel observado de la TPM, porcentaje; fuente intermediaria',
      subtitleEn: 'Observed policy rate level, percent; third-party source',
      dataStatus: 'sourced', seriesId: tpm.series.id, sourceUrl: tpm.series.sourceUrl,
      unit: '%', sourceIds: ['Mindicador'],
      reference: monthLabel(tpm.series.observations[0].period) + ' — ' + monthLabel(latestRecord(tpm.series).period),
      referenceEn: tpm.series.observations[0].period + ' — ' + latestRecord(tpm.series).period,
      footnote: 'Serie de niveles; no es variación mensual ni interanual. Fuente intermediaria Mindicador.',
      footnoteEn: 'Rate levels, not monthly or annual percent changes. Source: Mindicador.',
      axes: { left: 'TPM (%)', leftEn: 'Policy rate (%)', right: '', rightEn: '' },
      series: [{
        id: tpm.series.id, label: 'TPM', labelEn: 'Policy rate',
        type: 'line', axis: 'left', color: '#8660b1',
        valuesByVariation: { mensual: 'tpmRate', interanual: 'tpmRate' },
      }],
      data: chartData(tpm.series, 'tpmRate'),
    });
  }

  const activeCategories = new Set(summaries.cards.map(c => c.category));
  for (const lang of ['es', 'en']) {
    metadata.ui[lang].categories = (metadata.ui[lang].categories ?? []).filter(c => c.id === 'vision-general' || activeCategories.has(c.id));
  }
  metadata.sources = Object.fromEntries(Object.entries(metadata.sources).filter(([id]) => ['INE', 'Mindicador'].includes(id)));

  metadata.isDemo = false;
  metadata.status = 'live';
  metadata.updatedAt = checkedAt;
  metadata.asOfLabel = 'Consulta de motores: ' + checkedAt.slice(0, 10);
  metadata.asOfLabelEn = 'Data retrieval: ' + checkedAt.slice(0, 10);
  metadata.demoNotice = { es: '', en: '' };
  metadata.latestCompleteMonth = 'según última observación de cada serie';
  metadata.latestCompleteMonthEn = 'latest observation by series';
  metadata.delayedSeries = failures.map(x => ({
    id: x.code, name: x.name ?? x.code, nameEn: x.name ?? x.code,
    source: x.source ?? '', lastUpdate: x.lastUpdate ?? 'No disponible',
    reason: x.error, reasonEn: x.error,
  }));
  metadata.delayedSeriesCount = failures.length;
  metadata.ui.es.footerMethod = 'Cada indicador conserva su período, fuente y método de adquisición. Las series intermediadas se identifican expresamente.';
  metadata.ui.en.footerMethod = 'Every indicator has a reference period, source and acquisition method. Third-party mirror data is explicitly identified.';
  for (const lang of ['es', 'en']) {
    metadata.ui[lang].demoTag = '';
    metadata.ui[lang].cutLabel = '';
    metadata.ui[lang].mockSnapshot = '';
  }
  metadata.ui.es.delayedIntro = 'Fuentes con actualización fallida o valores no vigentes, sin reemplazo ficticio.';
  metadata.ui.en.delayedIntro = 'Sources with failed refresh or stale observations, without synthetic fallback.';
  metadata.ui.es.noCategoryCards = 'Aún no hay series verificadas disponibles en esta categoría.';
  metadata.ui.en.noCategoryCards = 'No sourced series are currently available in this category.';
  metadata.ui.es.noCategoryCharts = 'Aún no hay historia verificable disponible en esta categoría.';
  metadata.ui.en.noCategoryCharts = 'No verifiable history is available in this category.';
  metadata.ui.es.noTimelineResults = 'Sin publicaciones con fecha verificada.';
  metadata.ui.en.noTimelineResults = 'No releases with a verified publication date.';
  return result;
}
