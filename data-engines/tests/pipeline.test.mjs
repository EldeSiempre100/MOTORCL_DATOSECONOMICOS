import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsv, normalizeSimelRows } from '../ine_engine/simel.mjs';
import { mergeHistory, incrementalStart, validateSeries } from '../lib/history.mjs';
import { buildContracts } from '../lib/contracts.mjs';

const csv = 'DATAFLOW;FREQ;INDICADOR;AREA_REF;SEXO;TIME_PERIOD;OBS_VALUE;OBS_STATUS;UNIDAD;NOTAS\n' +
  'CL01:DF_TDES_SEXO(1.0);M;TDES;_T;AS;2026-06-01/P3M;9.640319093536927;;RT;"nota; con separador"\n';
const checkedAt = '2026-10-19T15:00:00.000Z';
const publications = { '2026-08': { publishedAt: '2026-09-30', documentUrl: 'https://www.ine.gob.cl/publicacion' } };

test('parses the official national rolling-quarter observation', () => {
  const [item] = normalizeSimelRows(parseCsv(csv));
  assert.equal(item.period, '2026-08');
  assert.equal(item.observedFrom, '2026-06-01');
  assert.equal(item.observedTo, '2026-08-31');
  assert.equal(item.value, 9.640319093536927);
});

test('rejects a regional or mismatched response', () => {
  const wrong = csv.replace(';_T;AS;', ';16;AS;');
  assert.throws(() => normalizeSimelRows(parseCsv(wrong)), /no coincide/);
});

test('keeps earlier observations and records later revisions', () => {
  const first = normalizeSimelRows(parseCsv(csv));
  const original = mergeHistory(null, first, publications, checkedAt);
  assert.equal(original.newCount, 1);
  assert.equal(incrementalStart(original.series), '2025-06');
  const same = mergeHistory(original.series, first, publications, '2026-10-20T15:00:00.000Z');
  assert.equal(same.revisedCount, 0);
  assert.equal(same.series.observations[0].firstSeenAt, checkedAt);
  const corrected = [{ ...first[0], value: 9.7 }];
  const revised = mergeHistory(same.series, corrected, publications, '2026-10-21T15:00:00.000Z');
  assert.equal(revised.revisedCount, 1);
  assert.equal(revised.series.observations[0].revisions[0].previousValue, 9.640319093536927);
  assert.equal(revised.series.observations[0].value, 9.7);
  assert.throws(() => validateSeries({ ...revised.series, unit: 'CLP' }), /Contrato de serie inválido/);
  assert.throws(() => validateSeries({ ...revised.series, observations: [revised.series.observations[0], revised.series.observations[0]] }), /Observación inválida/);
});

test('updates only the connected employment card, chart and event', () => {
  const series = mergeHistory(null, normalizeSimelRows(parseCsv(csv)), publications, checkedAt).series;
  const mockCard = { id: 'empleo', main: {}, subIndicators: [], sources: [] };
  const mockChart = { id: 'empleo', data: [], series: [] };
  const baseline = {
    metadata: { sources: { INE: { url: 'https://www.ine.gob.cl/' } }, demoNotice: {}, ui: { es: {}, en: {} } },
    summaries: { cards: [{ id: 'actividad' }, mockCard] },
    charts: { charts: [{ id: 'actividad' }, mockChart] },
    timeline: { events: [{ id: 'ipc', status: 'published', date: '2026-10-08' }, { id: 'empleo-trim' }] },
  };
  const output = buildContracts(baseline, series, checkedAt);
  assert.equal(output.summaries.cards[0].dataStatus, 'demo');
  assert.equal(output.summaries.cards[1].dataStatus, 'official');
  assert.equal(output.summaries.cards[1].main.valuesByVariation.mensual.ultimo.value, '9,6%');
  assert.equal(output.charts.charts[1].data[0].unemploymentRate, 9.64);
  assert.equal(output.timeline.events.find((item) => item.id === 'empleo-trim').publishedAt, '2026-09-30');
  assert.equal(output.timeline.events.find((item) => item.id === 'empleo-trim').dateText, '30 sep');
});

test('published contracts agree with the persisted official series', async () => {
  const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  const series = await load('../../data/series/ine.ene.tdes.nacional.total.json');
  const cards = await load('../../public/mock-data/summary_cards.json');
  const charts = await load('../../public/mock-data/charts_series.json');
  const timeline = await load('../../public/mock-data/timeline_events.json');
  const latest = series.observations.at(-1);
  const card = cards.cards.find((item) => item.id === 'empleo');
  const chart = charts.charts.find((item) => item.id === 'empleo');
  const event = timeline.events.find((item) => item.id === 'empleo-trim');
  assert.equal(series.id, card.seriesId);
  assert.equal(series.id, chart.seriesId);
  assert.equal(series.id, event.seriesId);
  assert.equal(Number.parseFloat(card.main.valuesByVariation.mensual.ultimo.value.replace(',', '.')), Number(latest.value.toFixed(1)));
  assert.equal(chart.data.at(-1).unemploymentRate, Number(latest.value.toFixed(3)));
  assert.equal(event.publishedAt, latest.publishedAt);
  assert.ok(cards.cards.filter((item) => item.id !== 'empleo').every((item) => item.dataStatus === 'demo'));
  assert.ok(charts.charts.filter((item) => item.id !== 'empleo').every((item) => item.dataStatus === 'demo'));
  assert.ok(timeline.events.filter((item) => item.id !== 'empleo-trim').every((item) => item.dataStatus === 'demo'));
});
