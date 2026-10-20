/**
 * Extend the same UI contracts with independently sourced economic series.
 * Never invent an observation, release date, seasonality or a missing comparison.
 */
const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2, minimumFractionDigits: 1 });
const cash = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const colors = { actividad:'#679b84', precios:'#c99c51', 'dolar-uf':'#688fb3', mercados:'#bd8759' };

function periodLabel(period) {
  const [year, month, day] = period.split('-');
  return (day ? day + ' ' : '') + months[Number(month)-1] + ' ' + year;
}
function valueFormat(value, spec) {
  if (spec.unit === 'clp') return '$' + cash.format(value);
  if (spec.unit === 'usd-lb') return 'US$' + cash.format(value);
  if (spec.unit === 'index') return fmt.format(value) + ' pts';
  return (value > 0 && spec.unit === 'percent-change' ? '+' : '') + fmt.format(value) + '%';
}
function difference(current, previous, spec) {
  if (previous === undefined || !Number.isFinite(previous)) return 'Sin comparación';
  const delta = current - previous;
  const prefix = delta > 0 ? '+' : '';
  if (spec.unit === 'clp') return prefix + '$' + cash.format(delta);
  if (spec.unit === 'usd-lb') return prefix + 'US$' + cash.format(delta);
  if (spec.unit === 'index') return prefix + fmt.format(delta) + ' pts';
  return prefix + fmt.format(delta) + ' pp';
}
function description(spec) {
  if (spec.unit === 'index') return 'Nivel del índice, no variación porcentual';
  if (spec.measure === 'mom') return 'Variación mensual del IPC, sin desestacionalizar';
  if (spec.measure === 'yoy') return 'Variación frente al mismo mes del año anterior, serie original';
  if (spec.unit === 'usd-lb') return 'Precio observado · dólares estadounidenses por libra';
  if (spec.code === 'utm') return 'Nivel mensual · pesos por UTM';
  if (spec.code === 'euro') return 'Pesos chilenos por euro';
  return 'Nivel observado · pesos chilenos';
}
function periodValue(series, spec, view, variation) {
  const history = series.observations;
  const last = history.at(-1);
  const previous = history.at(-2);
  const yearAgo = history.find(item => item.period.slice(0, 4) === String(Number(last.period.slice(0,4))-1) &&
    item.period.slice(5,7) === last.period.slice(5,7) &&
    (spec.frequency === 'monthly' || item.period.slice(8) === last.period.slice(8)));
  let reference = variation === 'interanual' ? yearAgo : previous;
  if (view === '12-meses') reference = yearAgo;
  if (view === 'anio') reference = history.find(item => item.period.startsWith(last.period.slice(0,4)));
  const measure = spec.measure === 'mom' ? 'variación mensual' :
    spec.measure === 'yoy' ? 'variación interanual' : 'nivel';
  const diagnosis = spec.measure && spec.measure !== 'level'
    ? (spec.measure === 'mom' ? 'IPC mensual' : 'Imacec interanual')
    : difference(last.value, reference?.value, spec);
  const context = periodLabel(last.period) + ' · ' + measure + ' · ' + spec.provider +
    (reference ? ' · respecto de ' + periodLabel(reference.period) + ': ' +
      (spec.measure && spec.measure !== 'level' ? 'comparación de tasas no calculada' : difference(last.value,reference.value,spec)) : '');
  return {
    value: valueFormat(last.value,spec), tone:'neutral',
    diagnosis, diagnosisEn:diagnosis, context,contextEn:context,
  };
}
function makeCard(series,spec) {
  const valuesByVariation = {};
  for (const variation of ['mensual','interanual']) {
    valuesByVariation[variation] = {};
    for (const period of ['ultimo','ultimo-mes','anio','12-meses','personalizado']) {
      valuesByVariation[variation][period] = periodValue(series,spec,period,variation);
    }
  }
  return {
    id: spec.id,category:spec.category, title:spec.name,titleEn:spec.nameEn,
    icon:spec.category === 'precios' ? 'prices' : 'activity',
    dataStatus:'sourced',seriesId:series.id,sourceUrl:series.sourceUrl,
    main: { name:spec.name,nameEn:spec.nameEn,description:description(spec),
      descriptionEn:description(spec),valuesByVariation },
    subIndicators:[],sources:[spec.provider],
  };
}
function makeChart(series,spec) {
  const key = 'v';
  const points = series.observations.slice(-365).map(row=>({
    period:row.period,label:periodLabel(row.period),labelEn:row.period,
    [key]:row.value,
  }));
  const label = spec.unit === 'clp' ? 'CLP' : spec.unit === 'index' ? 'Puntos de índice' : spec.unit === 'usd-lb' ? 'US$/libra' :
    spec.unit === 'percent-change' ? 'Variación (%)' : 'Porcentaje (%)';
  const historical = spec.measure === 'mom' ? 'Cada punto representa variación mensual del IPC' :
    spec.measure === 'yoy' ? 'Cada punto representa variación interanual del Imacec original' :
    'Cada punto representa el nivel observado, no una tasa de crecimiento';
  return {
    id:spec.id,category:spec.category, title:spec.name,titleEn:spec.nameEn,
    subtitle:description(spec),subtitleEn:description(spec),
    unit:label,sourceIds:[spec.provider],
    dataStatus:'sourced',seriesId:series.id,sourceUrl:series.sourceUrl,
    reference:periodLabel(points[0].period)+' — '+periodLabel(points.at(-1).period),
    referenceEn:points[0].period+' — '+points.at(-1).period,
    footnote:historical + '. Vía ' + spec.provider + '; fecha de observación distinta de la fecha de publicación.',
    footnoteEn:historical + '. Sourced via ' + spec.provider + '. Observation and publication dates differ.',
    axes:{left:label,leftEn:label,right:'',rightEn:''},
    series:[{id:series.id,label:spec.name,labelEn:spec.nameEn,
      type:spec.measure === 'mom' ? 'bar':'line',axis:'left',
      color:colors[spec.category]??'#728d9a',
      valuesByVariation:{mensual:key,interanual:key}}],
    data:points,
  };
}
export function appendSupplementalContracts(result,entries) {
  for (const {series,spec} of entries) {
    if (!series.observations?.length) throw new Error('Serie sin observaciones ' + series.id);
    result.summaries.cards.push(makeCard(series,spec));
    result.charts.charts.push(makeChart(series,spec));
    result.metadata.sources[spec.provider] = {
      url: spec.provider === 'Economía Chile' ? 'https://github.com/bastianolea/economia_chile' : spec.provider === 'Indicadores.cl' ? 'https://indicadores.cl/api/' : 'https://mindicador.cl/',
      displayName: spec.provider + ' · intermediario de datos',
      displayNameEn: spec.provider + ' · third-party data intermediary',
    };
  }
  return result;
}
