/**
 * Independent public, keyless intermediary. Observations are not labeled as
 * direct official API results. Validate period, unit, statistic and freshness.
 */
const BASE = 'https://indicadores.cl/api/v1';
export const SECONDARY_INDICATORS = Object.freeze({
  ipc: {
    id: 'indicadorescl.ipc.variacion.mensual', code: 'ipc',
    name: 'Inflación IPC', nameEn: 'CPI inflation',
    category: 'precios', organization: 'INE', provider: 'Indicadores.cl',
    unit: 'percent-change', measure: 'mom', frequency: 'monthly',
    min: -20, max: 30, maxAgeDays: 75,
    officialUrl: 'https://www.ine.gob.cl/estadisticas-por-tema/precios-e-inflacion/indice-de-precios-al-consumidor',
    // A separately checked release: September 2026 CPI = +0.4% m/m (INE).
    benchmark: { period: '2026-09', value: 0.4 },
  },
  imacec: {
    id: 'indicadorescl.imacec.variacion.anual', code: 'imacec',
    name: 'Imacec · variación anual', nameEn: 'Imacec · year-on-year',
    category: 'actividad', organization: 'BCCh', provider: 'Indicadores.cl',
    unit: 'percent-change', measure: 'yoy', frequency: 'monthly',
    min: -45, max: 65, maxAgeDays: 95,
    officialUrl: 'https://www.bcentral.cl/areas/estadisticas/imacec',
    // A separately checked release: August 2026 original Imacec -1.0% y/y (BCCh).
    benchmark: { period: '2026-08', value: -1.0 },
  },
});
function dayAtEndOfMonth(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export function normalizeIndicadoresCl(payload, spec, today = new Date().toISOString().slice(0, 10)) {
  if (!payload || payload.indicador !== spec.code || !Array.isArray(payload.serie) ||
      payload.serie.length < 2 || !payload.meta || payload.meta.api !== 'indicadores.cl') {
    throw new Error('Contrato Indicadores.cl inválido: ' + spec.code);
  }
  if ((spec.code === 'ipc' && payload.unidad !== 'porcentaje') ||
      (spec.code === 'imacec' && !/mismo mes del año anterior/.test(payload.unidad))) {
    throw new Error('Unidad/definición estadística no corresponde: ' + spec.code);
  }
  const records = new Map();
  for (const row of payload.serie) {
    const period = row?.mes;
    const value = spec.code === 'ipc' ? row?.variacionMensual : row?.valor;
    if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
        !Number.isFinite(value) || value < spec.min || value > spec.max) {
      throw new Error('Observación Indicadores.cl inválida: ' + String(period));
    }
    if (period > today.slice(0, 7)) continue; // No future releases.
    if (records.has(period) && records.get(period).value !== value) {
      throw new Error('Dos valores incompatibles en ' + period);
    }
    records.set(period, {
      period, observedFrom: period + '-01',
      observedTo: dayAtEndOfMonth(period),
      value, sourceStatus: null,
    });
  }
  const observations = [...records.values()].sort((a, b) => a.period.localeCompare(b.period));
  if (observations.length < 2) throw new Error('Historia mensual insuficiente');
  const latest = observations.at(-1);
  const advertised = payload.mes;
  if (advertised !== latest.period) throw new Error('Resumen y serie no coinciden: ' + spec.code);
  const summaryValue = spec.code === 'ipc' ? payload.variacionMensual : payload.valor;
  if (latest.value !== summaryValue) throw new Error('Valor resumen incompatible con última observación: ' + spec.code);
  const benchmark = observations.find(item => item.period === spec.benchmark.period);
  if (!benchmark || Math.abs(benchmark.value - spec.benchmark.value) > 0.000001) {
    throw new Error('No coincide con el boletín oficial de referencia: ' + spec.code);
  }
  const delta = (Date.parse(today) - Date.parse(latest.observedTo)) / 86400000;
  if (delta > spec.maxAgeDays) throw new Error('Serie vencida: ' + spec.code + ', ' + Math.floor(delta) + ' días');
  return observations;
}
export async function fetchIndicadoresCl(spec, fetcher = fetch, clock = new Date()) {
  const endpoint = BASE + '/' + spec.code + '.json';
  const response = await fetcher(endpoint, {
    signal: AbortSignal.timeout(25000),
    headers: { Accept: 'application/json', 'User-Agent': 'MotorCL/0.3' },
  });
  if (!response.ok) throw new Error('Indicadores.cl HTTP ' + response.status + ': ' + spec.code);
  const payload = await response.json();
  const observations = normalizeIndicadoresCl(payload, spec, clock.toISOString().slice(0, 10));
  return { endpoint, fetchedAt: clock.toISOString(), observations, advertisedPeriod: payload.mes };
}
