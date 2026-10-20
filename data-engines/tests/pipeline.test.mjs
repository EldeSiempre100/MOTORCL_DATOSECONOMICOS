import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsv, normalizeSimelRows } from '../ine_engine/simel.mjs';
import { mergeHistory, incrementalStart, validateSeries } from '../lib/history.mjs';
import { buildContracts } from '../lib/contracts.mjs';
import { buildLiveContracts } from '../lib/live-contracts.mjs';
import { normalizeMindicador, INDICATORS } from '../adapters/mindicador.mjs';
import { mergeProviderHistory } from '../lib/multi-history.mjs';

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
  assert.ok(cards.cards.every((item) => ['official', 'sourced'].includes(item.dataStatus)));
  assert.ok(charts.charts.every((item) => ['official', 'sourced'].includes(item.dataStatus)));
  assert.ok(timeline.events.every((item) => item.dataStatus === 'official'));
});


test('normalizes public mirror data without assuming publication dates or accepting projected UF', () => {
  const spec = INDICATORS.uf;
  const payload = { codigo: 'uf', autor: 'mindicador.cl', unidad_medida: 'Pesos',
    serie: [
      { fecha: '2026-10-20T03:00:00.000Z', valor: 41184.01 },
      { fecha: '2026-10-19T03:00:00.000Z', valor: 41183.94 },
      { fecha: '2026-11-09T03:00:00.000Z', valor: 41295.46 },
    ] };
  const points = normalizeMindicador(payload, spec, '2026-10-20');
  assert.equal(points.length, 2);
  assert.equal(points.at(-1).period, '2026-10-20');
  assert.equal(points.at(-1).publishedAt, undefined);
  assert.throws(() => normalizeMindicador({ ...payload, codigo: 'dolar' }, spec, '2026-10-20'), /inválida/);
  assert.throws(() => normalizeMindicador({ ...payload, serie: [{ fecha: '2026-10-20T03:00:00Z', valor: 900000 }] }, spec, '2026-10-20'), /fuera de rango/);
});

test('records independent mirror revisions without relabeling them as official', () => {
  const spec = INDICATORS.dolar, at = '2026-10-20T15:00:00.000Z';
  const point = { period: '2026-10-19', observedFrom: '2026-10-19', observedTo: '2026-10-19', value: 981.65, sourceStatus: null };
  const first = mergeProviderHistory(null, [point], spec, at, 'https://mindicador.cl/api/dolar');
  assert.equal(first.series.sourceProvider, 'Mindicador');
  assert.equal(first.series.officialCode, null);
  assert.equal(first.series.observations[0].publishedAt, null);
  const next = mergeProviderHistory(first.series, [{ ...point, value: 981.75 }], spec,
    '2026-10-21T15:00:00.000Z', 'https://mindicador.cl/api/dolar');
  assert.equal(next.revised, 1);
  assert.equal(next.series.observations[0].revisions[0].previousValue, 981.65);
  assert.equal(next.series.observations[0].value, 981.75);
  assert.ok(next.sha256);
});

test('live contracts hide all demonstration figures and expose sourced cards', () => {
  const official = mergeHistory(null, normalizeSimelRows(parseCsv(csv)), publications, checkedAt).series;
  const spec = INDICATORS.dolar;
  const snapshot = mergeProviderHistory(null,
    [{ period: '2026-10-18', observedFrom: '2026-10-18', observedTo: '2026-10-18', value: 980.1, sourceStatus: null },
     { period: '2026-10-19', observedFrom: '2026-10-19', observedTo: '2026-10-19', value: 981.65, sourceStatus: null }],
    spec, checkedAt, 'https://mindicador.cl/api/dolar').series;
  const baseline = {
    metadata: { projectName: 'MotorCL', sources: { INE: { url: 'https://www.ine.gob.cl/' } },
      ui: { es: {}, en: {} }, demoNotice: {} },
    summaries: { cards: [{ id: 'actividad', dataStatus: 'demo' }, { id: 'empleo', main: {}, subIndicators: [], sources: [] }] },
    charts: { charts: [{ id: 'actividad', dataStatus: 'demo' }, { id: 'empleo', data: [], series: [] }] },
    timeline: { events: [{ id: 'ipc', status: 'published', date: '2026-10-08' }, { id: 'empleo-trim' }] },
  };
  const contracts = buildLiveContracts(baseline, official, [{ spec, series: snapshot }], checkedAt);
  assert.equal(contracts.summaries.cards.length, 2);
  assert.equal(contracts.summaries.cards[0].dataStatus, 'official');
  assert.equal(contracts.summaries.cards[1].dataStatus, 'sourced');
  assert.ok(contracts.charts.charts.every(x => x.dataStatus !== 'demo'));
  assert.ok(contracts.timeline.events.every(x => x.dataStatus === 'official'));
  assert.equal(contracts.metadata.isDemo, false);
});


test('Mindicador UTM monthly normalization and merging use YYYY-MM periods', () => {
  const spec = { id:'test.utm', code:'utm', name:'UTM', nameEn:'Monthly tax unit', category:'dolar-uf', organization:'SII', provider:'Mindicador', unit:'clp', frequency:'monthly', min:10000, max:160000 };
  const payload = { autor: 'mindicador.cl', codigo: 'utm', unidad_medida: 'Pesos',
    serie: [
      { fecha:'2026-10-01T03:00:00.000Z', valor:72151 },
      { fecha:'2026-09-01T04:00:00.000Z', valor:71721 },
    ] };
  const points = normalizeMindicador(payload,spec,'2026-10-20');
  assert.deepEqual(points.map(item => item.period), ['2026-09','2026-10']);
  assert.equal(points[1].observedFrom,'2026-10-01');
  assert.equal(points[1].observedTo,'2026-10-31');
  const merged = mergeProviderHistory(null,points,spec,'2026-10-20T13:00:00.000Z','https://mindicador.cl/api/utm');
  assert.equal(merged.series.observations.length,2);
  assert.equal(merged.series.frequency,'monthly');
});

test('IPC adapter verifies monthly change definition and last published month', async () => {
  const { normalizeIndicadoresCl, SECONDARY_INDICATORS } = await import('../adapters/indicadores-cl.mjs');
  const spec = SECONDARY_INDICATORS.ipc;
  const sample = { indicador:'ipc',unidad:'porcentaje',mes:'2026-09',variacionMensual:0.4,
    meta:{api:'indicadores.cl'}, serie:[
      {mes:'2026-07',variacionMensual:0.1},
      {mes:'2026-08',variacionMensual:0.6},
      {mes:'2026-09',variacionMensual:0.4},
    ] };
  const result = normalizeIndicadoresCl(sample,spec,'2026-10-20');
  assert.equal(result.length,3);
  assert.deepEqual(result.at(-1),{
    period:'2026-09', observedFrom:'2026-09-01', observedTo:'2026-09-30',
    value:0.4, sourceStatus:null,
  });
  assert.throws(()=>normalizeIndicadoresCl({...sample,mes:'2026-08'},spec,'2026-10-20'),/Resumen y serie/);
  assert.throws(()=>normalizeIndicadoresCl({...sample,unidad:'Índice base'},spec,'2026-10-20'),/Unidad/);
  const series = mergeProviderHistory(null,result,spec,'2026-10-20T13:00:00.000Z','https://indicadores.cl/api/v1/ipc.json');
  assert.equal(series.series.measure,'mom');
});

test('Imacec adapter rejects mixing monthly variation with year-on-year growth', async () => {
  const { normalizeIndicadoresCl, SECONDARY_INDICATORS } = await import('../adapters/indicadores-cl.mjs');
  const spec=SECONDARY_INDICATORS.imacec;
  const sample={ indicador:'imacec',unidad:'variación % respecto del mismo mes del año anterior',
    mes:'2026-08',valor:-1,meta:{api:'indicadores.cl'},serie:[
      {mes:'2026-06',valor:2},
      {mes:'2026-07',valor:-1.5},
      {mes:'2026-08',valor:-1},
    ] };
  const result=normalizeIndicadoresCl(sample,spec,'2026-10-20');
  assert.equal(result.at(-1).value,-1);
  assert.throws(()=>normalizeIndicadoresCl({...sample,unidad:'variación mensual desestacionalizada'},spec,'2026-10-20'),/Unidad/);
});

test('new sourced indicators create real dashboards without fake release calendar', async () => {
  const { appendSupplementalContracts } = await import('../lib/supplemental-contracts.mjs');
  const { SECONDARY_INDICATORS } = await import('../adapters/indicadores-cl.mjs');
  const spec=SECONDARY_INDICATORS.ipc;
  const merged=mergeProviderHistory(null,[
    {period:'2026-08',observedFrom:'2026-08-01',observedTo:'2026-08-31',value:0.6,sourceStatus:null},
    {period:'2026-09',observedFrom:'2026-09-01',observedTo:'2026-09-30',value:0.4,sourceStatus:null},
  ], spec, '2026-10-20T13:00:00.000Z', 'https://indicadores.cl/api/v1/ipc.json');
  const baseline={metadata:{sources:{}},summaries:{cards:[]},charts:{charts:[]}};
  const output=appendSupplementalContracts(baseline,[{spec,series:merged.series}]);
  assert.equal(output.summaries.cards[0].dataStatus,'sourced');
  assert.equal(output.summaries.cards[0].main.valuesByVariation.mensual.ultimo.value,'+0,4%');
  assert.equal(output.charts.charts[0].series[0].type,'bar');
  assert.equal(output.charts.charts[0].data.at(-1).v,0.4);
  assert.ok(!('timeline' in output));
});


test('economic CSV parser validates original economic indices and their lineage', async () => {
  const { ECONOMIA_SERIES, parseEconomiaCsv } = await import('../adapters/economia-chile-csv.mjs');
  const spec=ECONOMIA_SERIES.ipc_indice;
  const dates=Array.from({length:12},(_,i)=>{
    const date=new Date(Date.UTC(2025,9+i,1));
    const year=date.getUTCFullYear(), month=date.getUTCMonth()+1;
    return {year,month,period: year+'-'+String(month).padStart(2,'0'),
      value:i===11?'113,59':String(104+i).replace('.',',')};
  });
  const rows=dates.map((date,index)=>
    '"' + (index+1) + '";"' + spec.rowName + '";"' + date.year + '-' + date.month + '-1";' +
    date.value+';'+date.year+';'+date.month+';2026-10-19'
  );
  const sample='"";"serie";"fecha";"valor";"año";"mes";"fecha_scraping"\n'+rows.join('\n');
  const out=parseEconomiaCsv(sample,spec,'2026-10-20');
  assert.equal(out.length,12);
  assert.equal(out.at(-1).period,'2026-09');
  assert.equal(out.at(-1).value,113.59);
  assert.throws(()=>parseEconomiaCsv('<<<<<<< HEAD\n'+sample,spec,'2026-10-20'),/corrupto/);
  assert.throws(()=>parseEconomiaCsv(sample.replace('113,59','900,00'),spec,'2026-10-20'),/fuera de rango|referencia/);
  const result=mergeProviderHistory(null,out,spec,'2026-10-20T13:00:00.000Z',
    'https://raw.githubusercontent.com/bastianolea/economia_chile/main/app/datos/ipc.csv');
  assert.equal(result.series.unit,'index');
  assert.equal(result.series.measure,'level');
  assert.equal(result.series.sourceProvider,'Economía Chile');
});


test('detail component is not accidentally duplicated during source edits', async () => {
  const source=await readFile(new URL('../../src/components/home/IndicatorDetail.tsx',import.meta.url),'utf8');
  const declarations=(source.match(/export function IndicatorDetail/g)??[]).length;
  assert.equal(declarations,1);
  assert.ok(source.length<30000,'The detail source unexpectedly grew from duplicate code');
});
