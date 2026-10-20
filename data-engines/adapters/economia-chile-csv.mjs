/**
 * Public CSV snapshots produced by the third-party economia_chile project.
 * Raw figures only; no GPL-licensed scraper code is incorporated.
 * Source repository https://github.com/bastianolea/economia_chile (GPL-3.0).
 * The original economic series are attributed to BCCh/INE; ingestion remains
 * explicitly third-party "sourced", never direct/official.
 */
const ROOT = 'https://raw.githubusercontent.com/bastianolea/economia_chile/main/app/datos/';
export const ECONOMIA_SERIES = Object.freeze({
  ipc_indice: {
    id: 'economiachile.ipc.indice.2023', code: 'ipc_indice', file: 'ipc.csv',
    rowName: 'Índice IPC General', name:'IPC general · índice', nameEn:'CPI index',
    category:'precios', organization:'INE', provider:'Economía Chile',
    unit:'index', measure:'level', frequency:'monthly', min:10, max:500,
    maxAgeDays:90, benchmark:{period:'2026-09',value:113.59},
    officialUrl:'https://www.ine.gob.cl/estadisticas-por-tema/precios-e-inflacion/indice-de-precios-al-consumidor',
  },
  imacec_indice: {
    id:'economiachile.imacec.original.indice', code:'imacec_indice', file:'imacec.csv',
    rowName:'Imacec empalmado, serie original (índice 2018=100)',
    name:'Imacec original · índice', nameEn:'Imacec unadjusted index',
    category:'actividad', organization:'BCCh', provider:'Economía Chile',
    unit:'index', measure:'level', frequency:'monthly', min:20,max:300,
    maxAgeDays:100, benchmark:{period:'2026-08',value:109.1},
    officialUrl:'https://www.bcentral.cl/areas/estadisticas/imacec',
  },
  ipsa_mensual: {
    id:'economiachile.ipsa.mensual',code:'ipsa_mensual',file:'ipsa.csv',
    rowName:'IPSA (índice enero 2003=1000)',
    name:'IPSA · serie mensual',nameEn:'IPSA monthly index',
    category:'mercados', organization:'BCCh',provider:'Economía Chile',
    unit:'index',measure:'level',frequency:'monthly',min:100,max:40000,
    maxAgeDays:90,benchmark:{period:'2026-09',value:11326.7},
    officialUrl:'https://si3.bcentral.cl/siete',
  },
  remuneracion_real: {
    id:'economiachile.remuneraciones.reales',code:'remuneracion_real',file:'remuneraciones.csv',
    rowName:'Índice real de remuneraciones',
    name:'Remuneraciones reales · índice',nameEn:'Real earnings index',
    category:'empleo',organization:'INE',provider:'Economía Chile',
    unit:'index',measure:'level',frequency:'monthly',min:20,max:500,
    maxAgeDays:100,benchmark:{period:'2026-08',value:110.16},
    officialUrl:'https://www.ine.gob.cl/estadisticas-por-tema/mercado-laboral/remuneraciones-y-costos-laborales',
  },
});
function dateEnd(period) {
  const [y,m]=period.split('-').map(Number);
  return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
}
function unquote(cell) {
  return cell.startsWith('"') && cell.endsWith('"') ? cell.slice(1,-1).replace(/""/g,'"') : cell;
}
export function parseEconomiaCsv(csv,spec,today='2026-10-20') {
  if(typeof csv !== 'string' || !csv.length || /^(<<<<<<<|=======|>>>>>>>)/m.test(csv)) {
    throw new Error('CSV ausente, corrupto o con conflictos Git: ' + spec.file);
  }
  const lines=csv.trim().split(/\r?\n/);
  const header=lines.shift()?.split(';').map(unquote);
  if(!header || header.join('|') !== '|serie|fecha|valor|año|mes|fecha_scraping') {
    throw new Error('Esquema CSV inesperado: ' + spec.file);
  }
  const byPeriod=new Map();
  let sourceCheck;
  for (const line of lines) {
    if(!line.trim()) continue;
    const fields=line.split(';').map(unquote);
    if(fields.length !== 7) throw new Error('Columnas inválidas: ' + spec.file);
    const [,name,date,price,year,month,scraped]=fields;
    if(name!==spec.rowName)continue;
    const bits=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
    if(!bits || Number(bits[3])!==1)throw new Error('Período mensual inválido: '+date);
    const period=bits[1]+'-'+bits[2].padStart(2,'0');
    if(Number(year)!==Number(bits[1])||Number(month)!==Number(bits[2])||
      Number(month)<1||Number(month)>12)throw new Error('Fecha y dimensiones incompatibles');
    const value=Number(price.replace(',','.'));
    if(!Number.isFinite(value)||value<spec.min||value>spec.max)throw new Error('Valor de índice fuera de rango '+period);
    if(period>today.slice(0,7))continue;
    if(byPeriod.has(period))throw new Error('Período duplicado '+period);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(scraped))throw new Error('Sin fecha de extracción');
    sourceCheck=scraped;
    byPeriod.set(period,{period,observedFrom:period+'-01',observedTo:dateEnd(period),value,sourceStatus:null});
  }
  const observations=[...byPeriod.values()].sort((a,b)=>a.period.localeCompare(b.period));
  if(observations.length<12)throw new Error('Historia incompleta '+spec.code);
  const latest=observations.at(-1);
  const age=(Date.parse(today)-Date.parse(latest.observedTo))/86400000;
  if(age>spec.maxAgeDays)throw new Error('Serie no vigente: '+spec.code);
  const benchmark=observations.find(o=>o.period===spec.benchmark.period);
  if(!benchmark||Math.abs(benchmark.value-spec.benchmark.value)>0.00001){
    throw new Error('No coincide con referencia económica '+spec.code);
  }
  const scrapeAge=(Date.parse(today)-Date.parse(sourceCheck))/86400000;
  if(scrapeAge>21||scrapeAge<0)throw new Error('Snapshot sin actualización reciente '+spec.code);
  return observations;
}
export async function fetchEconomiaCsv(spec,fetcher=fetch,clock=new Date()){
  const endpoint=ROOT+spec.file;
  const res=await fetcher(endpoint,{
    signal:AbortSignal.timeout(20000),
    headers:{Accept:'text/csv','User-Agent':'MotorCL/0.4 (public data integration)'},
  });
  if(!res.ok)throw new Error('GitHub CSV HTTP '+res.status+' '+spec.file);
  const content=await res.text();
  return {
    endpoint,
    fetchedAt:clock.toISOString(),
    observations:parseEconomiaCsv(content,spec,clock.toISOString().slice(0,10)),
  };
}
