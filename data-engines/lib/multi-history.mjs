import { createHash } from 'node:crypto';

export function contentHash(observations) {
  return createHash('sha256').update(JSON.stringify(observations)).digest('hex');
}

/**
 * An independent history registry for non-INE adapters.
 * Revising a past value adds an audit entry instead of destroying the old value.
 */
export function mergeProviderHistory(previous, incoming, spec, checkedAt, endpoint) {
  if (!Array.isArray(incoming) || !incoming.length) throw new Error('Sin observaciones para ' + spec.id);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(checkedAt)) throw new Error('Marca temporal de ingesta inválida');

  const stored = new Map((previous?.observations ?? []).map((point) => [point.period, point]));
  let added = 0;
  let revised = 0;
  for (const row of incoming) {
    const monthly = spec.frequency === 'monthly' && /^\d{4}-\d{2}$/.test(row?.period ?? '');
    const daily = spec.frequency !== 'monthly' && /^\d{4}-\d{2}-\d{2}$/.test(row?.period ?? '');
    const validPeriod = monthly
      ? row.observedFrom === row.period + '-01' && /^\d{4}-\d{2}-\d{2}$/.test(row.observedTo) &&
        row.observedTo.slice(0, 7) === row.period
      : daily && row.observedFrom === row.period && row.observedTo === row.period;
    if (!row || !Number.isFinite(row.value) || !validPeriod ||
        row.period > checkedAt.slice(0, monthly ? 7 : 10)) {
      throw new Error('Observación rechazada ' + String(row?.period));
    }
    const old = stored.get(row.period);
    if (!old) {
      added += 1;
      stored.set(row.period, {
        ...row, publishedAt: null, documentUrl: null,
        firstSeenAt: checkedAt, lastChangedAt: checkedAt, revisions: [],
      });
      continue;
    }
    const changed = old.value !== row.value || old.sourceStatus !== row.sourceStatus;
    if (changed) revised += 1;
    stored.set(row.period, {
      ...old, ...row,
      // In a third-party mirror, source dates are observed dates, NOT release dates.
      publishedAt: old.publishedAt ?? null,
      documentUrl: old.documentUrl ?? null,
      lastChangedAt: changed ? checkedAt : old.lastChangedAt,
      revisions: changed ? [...old.revisions, {
        detectedAt: checkedAt,
        previousValue: old.value,
        newValue: row.value,
        previousSourceStatus: old.sourceStatus,
        newSourceStatus: row.sourceStatus,
      }] : (old.revisions ?? []),
    });
  }
  const observations = [...stored.values()].sort((a, b) => a.period.localeCompare(b.period));
  for (let i = 0; i < observations.length; i += 1) {
    const item = observations[i];
    if (!Array.isArray(item.revisions) || (i && item.period === observations[i - 1].period)) {
      throw new Error('Historial duplicado o sin linaje: ' + item.period);
    }
  }
  const series = {
    schemaVersion: 1,
    id: spec.id, organization: spec.organization,
    sourceProvider: spec.provider,
    measure: spec.measure ?? 'level',
    officialCode: null, providerCode: spec.code,
    name: spec.name, nameEn: spec.nameEn,
    category: spec.category, frequency: spec.frequency, unit: spec.unit,
    sourceUrl: endpoint,
    methodologyUrl: spec.officialUrl ?? 'https://www.bcentral.cl/',
    lastSuccessfulRefresh: checkedAt,
    observations,
  };
  return { series, added, revised, sha256: contentHash(observations) };
}
