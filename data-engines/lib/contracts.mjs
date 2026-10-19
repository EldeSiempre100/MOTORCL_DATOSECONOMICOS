const periods = ['ultimo', 'ultimo-mes', 'anio', '12-meses', 'personalizado'];
const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function label(period, language = 'es') {
  const [year, month] = period.split('-').map(Number);
  const names = language === 'en' ? monthsEn : monthsEs;
  return `${names[month - 1]} ${String(year).slice(2)}`;
}

function dateLabel(date, language = 'es') {
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${language === 'en' ? monthsEn[month - 1] : monthsEs[month - 1]}`;
}

function rollingLabel(item, language = 'es') {
  const from = item.observedFrom.slice(0, 7);
  const to = item.period;
  return `${label(from, language)}–${label(to, language)}`;
}

function formatted(value, decimals = 1) {
  return new Intl.NumberFormat('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

function pointChange(current, earlier) {
  return earlier ? current.value - earlier.value : null;
}

function changeText(change) {
  return change === null ? 'sin comparación disponible' : `${change >= 0 ? '+' : ''}${formatted(change)} pp`;
}

function observationFor(series, period) {
  return series.observations.find((item) => item.period === period);
}

function previousYear(period) {
  return `${Number(period.slice(0, 4)) - 1}${period.slice(4)}`;
}

function valuesFor(latest, monthly, yearly, variation) {
  const comparison = variation === 'mensual' ? monthly : yearly;
  const comparisonName = variation === 'mensual' ? 'trimestre móvil anterior' : 'igual trimestre del año anterior';
  const context = `${rollingLabel(latest)} · ${changeText(comparison)} vs. ${comparisonName} · ${latest.publishedAt ? `publicado ${latest.publishedAt}` : 'fecha de publicación no disponible'}`;
  const contextEn = `${rollingLabel(latest, 'en')} · ${changeText(comparison)} vs. ${variation === 'mensual' ? 'prior rolling quarter' : 'same quarter last year'} · ${latest.publishedAt ? `published ${latest.publishedAt}` : 'publication date unavailable'}`;
  const available = {
    value: `${formatted(latest.value)}%`,
    tone: 'neutral',
    diagnosis: changeText(comparison),
    diagnosisEn: changeText(comparison),
    context,
    contextEn,
  };
  const unavailable = {
    value: '—',
    tone: 'neutral',
    diagnosis: 'No corresponde',
    diagnosisEn: 'Not applicable',
    context: 'La tasa de desocupación es un nivel de trimestre móvil; no tiene acumulado anual.',
    contextEn: 'The unemployment rate is a rolling-quarter level; an annual cumulative value does not apply.',
  };
  return Object.fromEntries(periods.map((period) => [period, period === 'ultimo' ? available : unavailable]));
}

export function buildContracts(baseline, series, checkedAt) {
  const { metadata, timeline, summaries, charts } = structuredClone(baseline);
  const latest = series.observations.at(-1);
  const prior = series.observations.at(-2);
  const yearAgo = observationFor(series, previousYear(latest.period));
  const monthly = pointChange(latest, prior);
  const yearly = pointChange(latest, yearAgo);
  const card = summaries.cards.find((item) => item.id === 'empleo');
  const chart = charts.charts.find((item) => item.id === 'empleo');
  if (!card || !chart) throw new Error('Contratos frontend sin tarjeta o gráfico de empleo');

  for (const item of summaries.cards) item.dataStatus = 'demo';
  for (const item of charts.charts) item.dataStatus = 'demo';
  for (const item of timeline.events) item.dataStatus = 'demo';

  card.dataStatus = 'official';
  card.seriesId = series.id;
  card.sourceUrl = series.sourceUrl;
  card.documentUrl = latest.documentUrl ?? series.methodologyUrl;
  card.main = {
    name: 'Tasa de desocupación nacional',
    nameEn: 'National unemployment rate',
    description: 'Nivel · trimestre móvil ENE',
    descriptionEn: 'Level · ENE rolling quarter',
    valuesByVariation: {
      mensual: valuesFor(latest, monthly, yearly, 'mensual'),
      interanual: valuesFor(latest, monthly, yearly, 'interanual'),
    },
  };
  card.subIndicators = [
    { name: 'Cambio mensual', nameEn: 'Monthly change', period: rollingLabel(latest), periodEn: rollingLabel(latest, 'en'),
      values: { mensual: changeText(monthly), interanual: changeText(monthly) }, toneByVariation: { mensual: 'neutral', interanual: 'neutral' } },
    { name: 'Cambio en doce meses', nameEn: '12-month change', period: rollingLabel(latest), periodEn: rollingLabel(latest, 'en'),
      values: { mensual: changeText(yearly), interanual: changeText(yearly) }, toneByVariation: { mensual: 'neutral', interanual: 'neutral' } },
  ];
  card.sources = ['INE'];

  chart.dataStatus = 'official';
  chart.seriesId = series.id;
  chart.sourceUrl = series.sourceUrl;
  chart.documentUrl = latest.documentUrl ?? series.methodologyUrl;
  chart.title = 'Tasa de desocupación nacional';
  chart.titleEn = 'National unemployment rate';
  chart.subtitle = 'Nivel del trimestre móvil · Encuesta Nacional de Empleo';
  chart.subtitleEn = 'Rolling-quarter level · National Employment Survey';
  chart.sourceIds = ['INE'];
  chart.reference = `${label(series.observations.at(-24)?.period ?? series.observations[0].period)} — ${label(latest.period)}`;
  chart.referenceEn = `${label(series.observations.at(-24)?.period ?? series.observations[0].period, 'en')} — ${label(latest.period, 'en')}`;
  chart.footnote = `Fuente: INE/SIMEL, código ${series.officialCode}. Los puntos son niveles de tasa, no variaciones porcentuales.`;
  chart.footnoteEn = `Source: INE/SIMEL, code ${series.officialCode}. Points are rate levels, not percentage changes.`;
  chart.axes = { left: 'Tasa (%)', leftEn: 'Rate (%)', right: '', rightEn: '' };
  chart.series = [{
    id: series.id, label: 'Desocupación', labelEn: 'Unemployment', type: 'line', axis: 'left', color: '#b57947',
    valuesByVariation: { mensual: 'unemploymentRate', interanual: 'unemploymentRate' },
  }];
  chart.data = series.observations.slice(-36).map((item) => ({
    period: item.period,
    label: label(item.period),
    labelEn: label(item.period, 'en'),
    unemploymentRate: Number(item.value.toFixed(3)),
  }));

  timeline.events = timeline.events.filter((item) => item.id !== 'empleo-trim');
  const released = [...series.observations].reverse().find((item) => item.publishedAt);
  if (released) timeline.events.push({
    id: 'empleo-trim',
    status: 'published',
    date: released.publishedAt,
    dateText: dateLabel(released.publishedAt),
    dateTextEn: dateLabel(released.publishedAt, 'en'),
    category: 'empleo',
    indicator: 'Tasa de desocupación nacional',
    indicatorEn: 'National unemployment rate',
    period: rollingLabel(released),
    periodEn: rollingLabel(released, 'en'),
    value: `${formatted(released.value)}%`,
    source: 'INE',
    tone: 'neutral',
    icon: 'employment',
    dataStatus: 'official',
    seriesId: series.id,
    sourceUrl: series.sourceUrl,
    documentUrl: released.documentUrl,
    publishedAt: released.publishedAt,
  });
  timeline.events.sort((a, b) => a.status === b.status
    ? a.status === 'published' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    : a.status === 'published' ? -1 : 1);

  metadata.status = 'mixed';
  metadata.isDemo = true;
  metadata.updatedAt = checkedAt;
  metadata.asOfLabel = `INE consultado ${checkedAt.slice(0, 10)}`;
  metadata.asOfLabelEn = `INE checked ${checkedAt.slice(0, 10)}`;
  metadata.latestCompleteMonth = 'según serie';
  metadata.latestCompleteMonthEn = 'by series';
  metadata.demoNotice = {
    es: 'La tasa de desocupación se obtiene de INE/SIMEL. Las demás cifras, fechas y expectativas de esta vista siguen siendo ejemplos no verificados.',
    en: 'The unemployment rate comes from INE/SIMEL. Other figures, dates and expectations in this view remain unverified examples.',
  };
  metadata.delayedSeriesCount = 0;
  metadata.delayedSeries = [];
  metadata.sources.INE = { ...metadata.sources.INE, url: series.methodologyUrl };
  const names = {
    BCCh: ['Banco Central de Chile', 'Central Bank of Chile'],
    INE: ['Instituto Nacional de Estadísticas', 'National Statistics Institute'],
    DIPRES: ['Dirección de Presupuestos', 'Budget Office'],
    MDS: ['Ministerio de Desarrollo Social', 'Ministry of Social Development'],
    SP: ['Superintendencia de Pensiones', 'Pension Regulator'],
  };
  for (const [id, [displayName, displayNameEn]] of Object.entries(names)) {
    if (metadata.sources[id]) Object.assign(metadata.sources[id], { displayName, displayNameEn });
  }
  metadata.ui.es.footerMethod = 'La tasa de desocupación usa la serie oficial INE/SIMEL. Los demás indicadores siguen señalados como ejemplos hasta conectar y verificar sus fuentes.';
  metadata.ui.en.footerMethod = 'The unemployment rate uses the official INE/SIMEL series. Other indicators remain labelled as examples until their sources are connected and verified.';
  metadata.ui.es.footerSourcesTitle = 'Fuentes y referencias';
  metadata.ui.en.footerSourcesTitle = 'Sources and references';
  metadata.ui.es.noTimelineResults = 'No hay publicaciones verificadas para esta selección.';
  metadata.ui.en.noTimelineResults = 'No verified releases for this selection.';
  return { metadata, timeline, summaries, charts };
}
