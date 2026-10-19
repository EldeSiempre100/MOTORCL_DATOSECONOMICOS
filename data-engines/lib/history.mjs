import { readFile, mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DATA_URL, DOCUMENT_URL, OFFICIAL_CODE, SERIES_ID } from '../ine_engine/simel.mjs';

export async function readJson(path, fallback = null) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  const content = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(temporary, content, 'utf8');
  try {
    await rename(temporary, path);
  } catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EEXIST'].includes(error.code)) throw error;
    // Windows can prevent replacing an open file; retain the existing path.
    await writeFile(path, content, 'utf8');
    await unlink(temporary);
  }
}

export function incrementalStart(previous) {
  const period = previous?.observations?.at(-1)?.period;
  if (!period) return undefined;
  const [year, month] = period.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1 - 14, 1));
  return start.toISOString().slice(0, 7);
}

export function validateSeries(series) {
  if (series.schemaVersion !== 1 || series.id !== SERIES_ID || series.organization !== 'INE' ||
      series.officialCode !== OFFICIAL_CODE || series.unit !== 'percent' ||
      series.frequency !== 'rolling-quarter-monthly' || !Array.isArray(series.observations) ||
      !series.observations.length) throw new Error('Contrato de serie inválido');
  const seen = new Set();
  for (const item of series.observations) {
    if (!/^\d{4}-\d{2}$/.test(item.period) || !/^\d{4}-\d{2}-\d{2}$/.test(item.observedFrom) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.observedTo) ||
        !Number.isFinite(item.value) || item.value < 0 || item.value > 100 ||
        !Array.isArray(item.revisions) || seen.has(item.period)) throw new Error(`Observación inválida: ${item.period}`);
    if (item.observedFrom > item.observedTo || item.observedTo.slice(0, 7) !== item.period ||
        (item.publishedAt && (item.publishedAt < item.observedTo || !/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt)))) {
      throw new Error(`Fechas de observación inválidas: ${item.period}`);
    }
    seen.add(item.period);
  }
  return series;
}

export function mergeHistory(previous, incoming, publications, checkedAt) {
  const existing = new Map((previous?.observations ?? []).map((item) => [item.period, item]));
  let newCount = 0;
  let revisedCount = 0;
  for (const item of incoming) {
    const old = existing.get(item.period);
    const publication = publications[item.period] ?? null;
    if (!old) {
      newCount += 1;
      existing.set(item.period, {
        ...item,
        publishedAt: publication?.publishedAt ?? null,
        documentUrl: publication?.documentUrl ?? null,
        firstSeenAt: checkedAt,
        lastChangedAt: checkedAt,
        revisions: [],
      });
    } else {
      const changed = old.value !== item.value || old.sourceStatus !== item.sourceStatus;
      if (changed) revisedCount += 1;
      existing.set(item.period, {
        ...old,
        ...item,
        publishedAt: publication?.publishedAt ?? old.publishedAt ?? null,
        documentUrl: publication?.documentUrl ?? old.documentUrl ?? null,
        lastChangedAt: changed ? checkedAt : old.lastChangedAt,
        revisions: changed ? [...old.revisions, {
          detectedAt: checkedAt,
          previousValue: old.value,
          newValue: item.value,
          previousSourceStatus: old.sourceStatus,
          newSourceStatus: item.sourceStatus,
        }] : old.revisions,
      });
    }
  }
  const observations = [...existing.values()].sort((a, b) => a.period.localeCompare(b.period));
  if (!observations.length) throw new Error('No hay historia de desocupación para conservar');
  for (const item of observations) {
    if (item.period > checkedAt.slice(0, 7)) throw new Error(`Período futuro: ${item.period}`);
    if (item.publishedAt && item.publishedAt < item.observedTo) throw new Error(`Fecha de publicación anterior al período: ${item.period}`);
  }
  return {
    series: validateSeries({
      schemaVersion: 1,
      id: SERIES_ID,
      organization: 'INE',
      officialCode: OFFICIAL_CODE,
      name: 'Tasa de desocupación nacional',
      nameEn: 'National unemployment rate',
      category: 'empleo',
      frequency: 'rolling-quarter-monthly',
      unit: 'percent',
      sourceUrl: DATA_URL,
      methodologyUrl: DOCUMENT_URL,
      lastSuccessfulRefresh: checkedAt,
      observations,
    }),
    newCount,
    revisedCount,
  };
}
