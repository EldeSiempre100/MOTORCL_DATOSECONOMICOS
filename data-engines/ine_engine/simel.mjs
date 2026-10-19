export const SERIES_ID = 'ine.ene.tdes.nacional.total';
export const OFFICIAL_CODE = 'CL01:DF_TDES_SEXO(1.0)/M.TDES._T.AS';
export const DATA_URL = 'https://sdmx.ine.gob.cl/rest/data/CL01,DF_TDES_SEXO,1.0/M.TDES._T.AS?format=csv';
export const DOCUMENT_URL = 'https://www.ine.gob.cl/estadisticas-por-tema/mercado-laboral/ocupacion-y-desocupacion';

// The SIMEL CSV contains quoted HTML fields with commas. Parse those fields without
// depending on a third-party SDK or copying code from an external repository.
export function parseCsv(csv) {
  const rows = [];
  const delimiter = csv.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('CSV SIMEL con comillas sin cerrar');
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...values] = rows;
  if (!headers) throw new Error('CSV SIMEL vacío');
  return values.map((cells) => Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ''), cells[index] ?? ''])));
}

function monthEnd(year, month) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function normalizeSimelRows(rows) {
  const observations = [];
  const seen = new Set();
  for (const row of rows) {
    if (row.DATAFLOW !== 'CL01:DF_TDES_SEXO(1.0)' || row.FREQ !== 'M' ||
        row.INDICADOR !== 'TDES' || row.AREA_REF !== '_T' || row.SEXO !== 'AS' ||
        row.UNIDAD !== 'RT') {
      throw new Error('La respuesta SIMEL no coincide con el código nacional seleccionado');
    }
    const match = /^(\d{4})-(\d{2})-01\/P3M$/.exec(row.TIME_PERIOD);
    if (!match) throw new Error(`Período SIMEL inesperado: ${row.TIME_PERIOD}`);
    const startYear = Number(match[1]);
    const startMonth = Number(match[2]);
    const end = new Date(Date.UTC(startYear, startMonth + 1, 1));
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth() + 1;
    const period = `${endYear}-${String(endMonth).padStart(2, '0')}`;
    const value = Number(row.OBS_VALUE);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Tasa de desocupación inválida: ${row.OBS_VALUE}`);
    if (seen.has(period)) throw new Error(`Período duplicado: ${period}`);
    seen.add(period);
    observations.push({
      period,
      observedFrom: `${match[1]}-${match[2]}-01`,
      observedTo: monthEnd(endYear, endMonth),
      value,
      sourceStatus: row.OBS_STATUS || null,
    });
  }
  if (!observations.length) throw new Error('SIMEL no devolvió observaciones');
  observations.sort((a, b) => a.period.localeCompare(b.period));
  return observations;
}

export async function fetchUnemployment(startPeriod, fetcher = fetch) {
  const url = new URL(DATA_URL);
  if (startPeriod) url.searchParams.set('startPeriod', startPeriod);
  const response = await fetcher(url, {
    headers: { Accept: 'text/csv', 'Accept-Language': 'es-CL,es;q=0.9', 'User-Agent': 'MotorCL/0.1' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`SIMEL respondió HTTP ${response.status}`);
  return normalizeSimelRows(parseCsv(await response.text()));
}
