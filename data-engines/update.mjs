import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fetchUnemployment, SERIES_ID } from './ine_engine/simel.mjs';
import { mergeHistory, incrementalStart, readJson, writeJson } from './lib/history.mjs';
import { fetchMindicador, INDICATORS } from './adapters/mindicador.mjs';
import { fetchIndicadoresCl, SECONDARY_INDICATORS } from './adapters/indicadores-cl.mjs';
import { mergeProviderHistory, contentHash } from './lib/multi-history.mjs';
import { buildLiveContracts } from './lib/live-contracts.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicData = resolve(root, 'public/mock-data');
const seriesPath = (id) => resolve(root, 'data/series/' + id + '.json');
const publicSeriesPath = (id) => resolve(root, 'public/series/' + id + '.json');
const files = {
  metadata: 'app_metadata.json',
  timeline: 'timeline_events.json',
  summaries: 'summary_cards.json',
  charts: 'charts_series.json',
};

function sourceError(code, name, source, error, lastUpdate) {
  return {
    code, name, source, error: error instanceof Error ? error.message : String(error),
    lastUpdate: lastUpdate ?? 'No disponible',
  };
}

function verifyContracts(output, ineId, entries) {
  for (const [type, value] of Object.entries(output)) {
    if (!value || typeof value !== 'object') throw new Error('Contrato vacío: ' + type);
  }
  if (output.summaries.cards.some(x => !['official', 'sourced'].includes(x.dataStatus)) ||
      output.charts.charts.some(x => !['official', 'sourced'].includes(x.dataStatus)) ||
      output.timeline.events.some(x => x.dataStatus !== 'official')) {
    throw new Error('Se detectaron datos de ejemplo en contratos públicos');
  }
  if (output.summaries.cards.find(x => x.seriesId === ineId)?.dataStatus !== 'official') {
    throw new Error('El dashboard perdió la serie INE');
  }
  for (const entry of entries) {
    if (!entry.series.observations.length) throw new Error('Publicación sin historia: ' + entry.series.id);
    if (!output.charts.charts.some(x => x.category === entry.spec.category && x.dataStatus === 'sourced')) {
      throw new Error('Serie sin gráfico visible: ' + entry.series.id);
    }
  }
  return output;
}

async function main() {
  const checkedAt = new Date().toISOString();
  const runId = 'motorcl-' + checkedAt.replace(/[-:.TZ]/g, '');
  const priorIne = await readJson(seriesPath(SERIES_ID));
  const publications = await readJson(resolve(root, 'data-engines/ine_engine/publications.json'), {});
  const errors = [];
  let ineStats = { newCount: 0, revisedCount: 0 };
  let ine;

  try {
    const incoming = await fetchUnemployment(incrementalStart(priorIne));
    const merged = mergeHistory(priorIne, incoming, publications, checkedAt);
    ine = merged.series;
    ineStats = merged;
  } catch (error) {
    if (!priorIne?.observations?.length) throw error; // Never synthesize a first official series.
    ine = priorIne;
    errors.push(sourceError('INE', 'Tasa de desocupación nacional', 'INE/SIMEL', error, priorIne.lastSuccessfulRefresh));
    console.warn('INE/SIMEL: conservando último historial verificado: ' + error);
  }

  const providerEntries = [];
  const extraFiles = [];
  const sourceRuns = [];
  const allSources = [...Object.values(INDICATORS), ...Object.values(SECONDARY_INDICATORS)];
  async function ingest(spec) {
    const previous = await readJson(seriesPath(spec.id));
    try {
      const incoming = spec.provider === 'Indicadores.cl'
        ? await fetchIndicadoresCl(spec) : await fetchMindicador(spec, previous);
      const result = mergeProviderHistory(previous, incoming.observations, spec, checkedAt, incoming.endpoint);
      console.log('Source ready:', spec.code, result.series.observations.length, 'observations');
      return {
        entry: {spec,series:result.series},
        files: [
          {path:seriesPath(spec.id),content:result.series},
          {path:publicSeriesPath(spec.id),content:result.series},
        ],
        run: {
          source:spec.provider,code:spec.code,seriesId:spec.id,
          state:'ok',latestPeriod:result.series.observations.at(-1).period,
          observations:result.series.observations.length,added:result.added,revised:result.revised,
          sha256:result.sha256,endpoint:incoming.endpoint,fetchedAt:incoming.fetchedAt,
        },
      };
    } catch (error) {
      console.warn('Source failed:', spec.code, String(error));
      return {
        entry: previous?.observations?.length ? {spec,series:previous} : null,
        files: [],
        run: {
          source:spec.provider,code:spec.code,seriesId:spec.id,
          state:'failed',message:String(error),
          latestPeriod:previous?.observations?.at(-1)?.period ?? null,
        },
        error:sourceError(spec.code,spec.name,spec.provider,error,previous?.lastSuccessfulRefresh),
      };
    }
  }
  // Bounded concurrency: downloading every series sequentially caused
  // multi-minute jobs. More than three concurrent vendors risks throttling.
  for (let index=0; index<allSources.length; index+=3) {
    const batch=await Promise.all(allSources.slice(index,index+3).map(ingest));
    for (const item of batch) {
      if (item.entry) providerEntries.push(item.entry);
      extraFiles.push(...item.files);
      sourceRuns.push(item.run);
      if (item.error) errors.push(item.error);
    }
  }

  const baseline = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, name]) =>
    [key, await readJson(resolve(publicData, name))])));
  if (Object.values(baseline).some(value => value === null)) {
    throw new Error('Faltan contratos JSON del frontend');
  }

  const contracts = verifyContracts(buildLiveContracts(baseline, ine, providerEntries, checkedAt, errors), ine.id, providerEntries);
  const series = [ine, ...providerEntries.map(x => x.series)];
  const catalog = {
    schemaVersion: 1, runId, generatedAt: checkedAt,
    series: series.map(x => ({
      id: x.id, name: x.name, nameEn: x.nameEn, organization: x.organization,
      sourceProvider: x.sourceProvider ?? x.organization,
      officialCode: x.officialCode,
      providerCode: x.providerCode ?? null,
      dataStatus: x.sourceProvider ? 'sourced' : 'official',
      frequency: x.frequency, unit: x.unit, endpoint: x.sourceUrl,
      latestPeriod: x.observations.at(-1).period,
      lastSuccessfulRefresh: x.lastSuccessfulRefresh,
      sha256: contentHash(x.observations),
      available: true,
      stale: errors.some(e => e.code === (x.providerCode ?? x.organization)),
    })),
  };
  const status = {
    schemaVersion: 2, runId, checkedAt,
    latestSuccessfulRefresh: checkedAt, result: errors.length ? 'partial' : 'ok',
    sources: [{
      source: 'INE/SIMEL', code: SERIES_ID, seriesId: SERIES_ID,
      state: errors.some(e => e.code === 'INE') ? 'failed' : 'ok',
      latestPeriod: ine.observations.at(-1).period,
      observations: ine.observations.length,
      added: ineStats.newCount, revised: ineStats.revisedCount,
      sha256: createHash('sha256').update(JSON.stringify(ine.observations)).digest('hex'),
      endpoint: ine.sourceUrl,
    }, ...sourceRuns],
    errors, publishedSeries: series.length,
  };
  // Everything is validated in memory BEFORE any public files are written.
  // A failing Actions run cannot commit partial changes to the repository.
  await writeJson(seriesPath(SERIES_ID), ine);
  await writeJson(publicSeriesPath(SERIES_ID), ine);
  for (const file of extraFiles) await writeJson(file.path, file.content);
  for (const [key, name] of Object.entries(files)) {
    await writeJson(resolve(publicData, name), contracts[key]);
  }
  await writeJson(resolve(root, 'data/ingestion-status.json'), status);
  await writeJson(resolve(root, 'public/data/ingestion-status.json'), status);
  await writeJson(resolve(root, 'public/data/catalog.json'), catalog);
  console.log(JSON.stringify(status, null, 2));
}

main().catch(error => {
  console.error('MotorCL update: ' + error.stack);
  process.exitCode = 1;
});
