/**
 * Mindicador is a public THIRD-PARTY mirror of Chilean economic indicators.
 * Its observations must not be described as directly verified BCCh publications.
 * Never infer publication dates from the API response timestamp.
 */
export const MINDICADOR_BASE = 'https://mindicador.cl/api';

export const INDICATORS = Object.freeze({
  dolar: {
    id: 'mindicador.dolar.observado', code: 'dolar',
    name: 'Dólar observado', nameEn: 'Observed US dollar',
    category: 'dolar-uf', organization: 'BCCh', provider: 'Mindicador',
    unit: 'clp', frequency: 'daily', min: 300, max: 3000,
    maxAgeDays: 12,
  },
  uf: {
    id: 'mindicador.uf', code: 'uf',
    name: 'Unidad de Fomento (UF)', nameEn: 'Inflation-indexed unit (UF)',
    category: 'dolar-uf', organization: 'BCCh', provider: 'Mindicador',
    unit: 'clp', frequency: 'daily', min: 1000, max: 150000,
    maxAgeDays: 6,
  },
  euro: {
    id: 'mindicador.euro.clp', code: 'euro', name: 'Euro observado',
    nameEn: 'Observed euro', category: 'dolar-uf',
    organization: 'BCCh', provider: 'Mindicador',
    unit: 'clp', frequency: 'daily', min: 300, max: 4000, maxAgeDays: 12,
  },
  utm: {
    id: 'mindicador.utm', code: 'utm', name: 'Unidad Tributaria Mensual',
    nameEn: 'Monthly tax unit (UTM)', category: 'dolar-uf',
    organization: 'SII', provider: 'Mindicador',
    unit: 'clp', frequency: 'monthly', min: 10000, max: 160000, maxAgeDays: 45,
  },
  ivp: {
    id: 'mindicador.ivp', code: 'ivp', name: 'Índice de Valor Promedio (IVP)',
    nameEn: 'Average value index (IVP)', category: 'dolar-uf',
    organization: 'BCCh', provider: 'Mindicador',
    unit: 'clp', frequency: 'daily', min: 1000, max: 150000, maxAgeDays: 10,
  },
  libra_cobre: {
    id: 'mindicador.cobre.usd.lb', code: 'libra_cobre', name: 'Precio del cobre',
    nameEn: 'Copper price', category: 'mercados',
    organization: 'BCCh', provider: 'Mindicador',
    unit: 'usd-lb', frequency: 'daily', min: 0.3, max: 25, maxAgeDays: 12,
  },
  tpm: {
    id: 'mindicador.tpm', code: 'tpm',
    name: 'Tasa de Política Monetaria (TPM)', nameEn: 'Monetary policy rate',
    category: 'tasas', organization: 'BCCh', provider: 'Mindicador',
    unit: 'percent', frequency: 'daily', min: 0, max: 40,
    maxAgeDays: 40,
  },
});

function normalizeRecord(record, spec, today) {
  if (!record || typeof record.fecha !== 'string' || typeof record.valor !== 'number') {
    throw new Error('Estructura de observación inválida: ' + spec.code);
  }
  const rawDate = record.fecha.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ||
      Number.isNaN(Date.parse(rawDate)) ||
      new Date(rawDate).toISOString().slice(0, 10) !== rawDate) {
    throw new Error('Fecha inválida para ' + spec.code + ': ' + record.fecha);
  }
  const monthly = spec.frequency === 'monthly';
  if (monthly && !rawDate.endsWith('-01')) {
    throw new Error('Un dato mensual debe corresponder al primer día del mes: ' + spec.code);
  }
  const period = monthly ? rawDate.slice(0, 7) : rawDate;
  if (period > today.slice(0, monthly ? 7 : 10)) return null; // Exclude future periods.
  if (!Number.isFinite(record.valor) || record.valor < spec.min || record.valor > spec.max) {
    throw new Error('Valor fuera de rango para ' + spec.code + ' en ' + period);
  }
  return {
    period, observedFrom: monthly ? period + '-01' : period,
    observedTo: monthly ? new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)).toISOString().slice(0, 10) : period,
    value: record.valor,
    sourceStatus: null,
  };
}

export function normalizeMindicador(payload, spec, today = new Date().toISOString().slice(0, 10)) {
  if (payload?.codigo !== spec.code || payload?.autor !== 'mindicador.cl' ||
      !Array.isArray(payload.serie) || !payload.serie.length) {
    throw new Error('Respuesta Mindicador inválida para ' + spec.code);
  }
  if ((spec.unit === 'clp' && payload.unidad_medida !== 'Pesos') ||
      (spec.unit === 'percent' && payload.unidad_medida !== 'Porcentaje') ||
      (spec.unit === 'usd-lb' && payload.unidad_medida !== 'Dólar')) {
    throw new Error('Unidad Mindicador no reconocida para ' + spec.code);
  }
  const entries = new Map();
  for (const item of payload.serie) {
    const point = normalizeRecord(item, spec, today);
    if (!point) continue;
    const existing = entries.get(point.period);
    if (existing && existing.value !== point.value) {
      throw new Error('Dos valores distintos para ' + spec.code + ' en ' + point.period);
    }
    entries.set(point.period, point);
  }
  return [...entries.values()].sort((a, b) => a.period.localeCompare(b.period));
}

async function getJson(url, fetcher) {
  const response = await fetcher(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'MotorCL/0.2 (+economic data project)' },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error('Mindicador HTTP ' + response.status + ': ' + url);
  return response.json();
}

/**
 * Annual history backfill on first run, then current + previous year to catch revisions.
 * Use the last-month endpoint additionally because it can publish newer data than yearly caches.
 */
export async function fetchMindicador(spec, previous, fetcher = fetch, clock = new Date()) {
  const today = clock.toISOString().slice(0, 10);
  const year = clock.getUTCFullYear();
  const years = previous?.observations?.length ? [year - 1, year] : [year - 2, year - 1, year];
  const records = new Map();
  let successful = 0;
  let latestEndpoint = MINDICADOR_BASE + '/' + spec.code;
  for (const y of years) {
    const url = MINDICADOR_BASE + '/' + spec.code + '/' + y;
    try {
      const payload = await getJson(url, fetcher);
      for (const point of normalizeMindicador(payload, spec, today)) records.set(point.period, point);
      successful += 1;
    } catch (error) {
      // A yearly mirror can temporarily fail; the current series endpoint remains mandatory.
      console.warn('Mindicador historical warning', spec.code, y, String(error));
    }
  }
  const payload = await getJson(latestEndpoint, fetcher);
  const recent = normalizeMindicador(payload, spec, today);
  if (!recent.length) throw new Error('Mindicador no devolvió fechas vigentes para ' + spec.code);
  for (const point of recent) records.set(point.period, point);
  const observations = [...records.values()].sort((a, b) => a.period.localeCompare(b.period));
  const newest = observations.at(-1);
  if (!newest) throw new Error('Sin datos Mindicador: ' + spec.code);
  const age = Math.round((Date.parse(today) - Date.parse(newest.period)) / 86400000);
  if (age > spec.maxAgeDays) {
    throw new Error('Serie vencida (' + age + ' días) de ' + spec.code + ' en ' + latestEndpoint);
  }
  return {
    observations, endpoint: latestEndpoint,
    sourcesChecked: successful + 1,
    fetchedAt: clock.toISOString(),
  };
}
