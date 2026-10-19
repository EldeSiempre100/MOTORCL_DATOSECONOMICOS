# Fuentes económicas chilenas — fase 2

Investigación e integración inicial realizada el 19 de octubre de 2026. Un repositorio público puede ser un cliente o una referencia técnica; los valores publicados por MotorCL deben proceder de los organismos emisores.

## Fuente conectada

| Campo | Valor |
| --- | --- |
| Organismo | Instituto Nacional de Estadísticas (INE) |
| Sistema | [SIMEL, API SDMX](https://www.ine.gob.cl/simel/guia-de-uso) |
| Serie | Tasa de desocupación nacional, ambos sexos, trimestre móvil |
| Código | `CL01:DF_TDES_SEXO(1.0)/M.TDES._T.AS` |
| Endpoint | <https://sdmx.ine.gob.cl/rest/data/CL01,DF_TDES_SEXO,1.0/M.TDES._T.AS?format=csv> |
| Frecuencia / unidad | mensual (trimestre móvil) / porcentaje de la fuerza de trabajo |
| Último período recuperado | junio–agosto de 2026; tasa original 9,640319093536927 %, mostrada como 9,6 % |
| Publicación verificada para ese período | [Comunicado INE, 30 de septiembre de 2026](https://www.ine.gob.cl/sala-de-prensa/prensa/general/noticia/2026/09/30/la-tasa-de-desocupaci%C3%B3n-nacional-fue-9-6-en-el-trimestre-junio---agosto-de-2026) |

La consulta devuelve 198 observaciones desde el trimestre enero–marzo de 2010 hasta junio–agosto de 2026. El CSV oficial usa `;`, aunque el parser también acepta `,`. Se comprueban dimensiones, frecuencia, unidad, fechas, ausencia de duplicados y rango numérico antes de publicar.

La fecha final del trimestre móvil es la **fecha del período observado**. La fecha del comunicado se registra como **fecha de publicación** solamente cuando se verificó el documento. `lastSuccessfulRefresh`, `firstSeenAt` y `lastChangedAt` son fechas del sistema, nunca fechas de publicación. La API no entregó una fecha de publicación por cada observación histórica; por ello esos campos quedan en `null`, sin inferencia. El estado de observación del CSV se conserva como `sourceStatus` cuando venga informado.

Los cambios entre trimestres móviles y respecto a doce meses se muestran en **puntos porcentuales**. No se presenta acumulado anual de una tasa de nivel. El filtro general de la vista conserva sus opciones, pero las selecciones que no corresponden a esta serie devuelven «No corresponde».

## Repositorios examinados

La licencia indicada es la observada en GitHub al investigar. La ausencia de licencia detectada impide asumir permiso para reutilizar código. **No se copió código de estos proyectos.**

| Repositorio | Licencia observada | Uso posible / límite |
| --- | --- | --- |
| [airarrazaval/bcchapi](https://github.com/airarrazaval/bcchapi) | MIT | Cliente de la API del BCCh; requiere credenciales/token. Referencia para un conector futuro. |
| [LeonardoSanz/bcch_monitor_Chile](https://github.com/LeonardoSanz/bcch_monitor_Chile) | Sin licencia detectada | Monitor de referencia; no reutilizar código sin autorización. |
| [Atelier-Busco/chile-indicadores-economicos-daily](https://github.com/Atelier-Busco/chile-indicadores-economicos-daily) | Sin licencia detectada | Ejemplo de actualización diaria; no tratar su salida como fuente oficial ni copiar código. |
| [bastianolea/economia_chile](https://github.com/bastianolea/economia_chile) | GPL-3.0 | Referencia de catálogo y extracción; no incorporar código GPL sin evaluar sus obligaciones. |
| [ezer-mackenzie/chile-ine-sdk](https://github.com/ezer-mackenzie/chile-ine-sdk) | MIT | Cliente INE/SIMEL; la integración inicial usa directamente la API oficial y un parser pequeño propio. |
| [LautaroParada/cmf-chile](https://github.com/LautaroParada/cmf-chile) | MIT | Cliente CMF; verificar actualidad y endpoints antes de usarlo. |
| [JoaquinMulet/mcp-cmf-chile](https://github.com/JoaquinMulet/mcp-cmf-chile) | MIT | Referencia técnica para CMF; no es una fuente de datos en sí misma. |

## Próximas fuentes

- **BCCh:** [API BDE](https://si3.bcentral.cl/estadisticas/Principal1/Web_Services/acceso_api.html). El servicio REST exige token. Candidatos: dólar, UF, TPM, Imacec y PIB, con códigos específicos verificados en el catálogo oficial antes de integrar. Empleo, IPC y comercio pueden tener estadísticas del BCCh, pero se debe escoger el organismo y la definición correctos por indicador. Ninguno está conectado aún.
- **INE:** SIMEL deja disponible la serie de empleo implementada. IPC, remuneraciones, industria, comercio y datos regionales requieren verificar otros flujos de INE y sus metadatos antes de ampliar la ingesta. No se extrapola el código de desocupación.
- **CMF:** la [API CMF Bancos](https://api.cmfchile.cl/) publica recursos financieros. Falta seleccionar endpoints, comprobar condiciones de acceso y conseguir clave si se exige. Sin cifras conectadas.
- **DIPRES:** tiene [datos abiertos e informes de ejecución](https://www.dipres.gob.cl/). Falta elegir archivos oficiales estables y normalizar ingresos, gastos y balance por período. Sin cifras conectadas.

## Persistencia y actualización

La historia canónica se conserva como JSON versionado en `data/series/`; este volumen inicial no justifica SQLite. La salida estática para React está en `public/series/` y `public/mock-data/`. El código de serie `ine.ene.tdes.nacional.total` enlaza tarjeta, gráfico, publicación y ficha. La actualización consulta una ventana reciente de 14 meses, fusiona por período, registra cualquier revisión detectada y mantiene las observaciones fuera de esa ventana. Una primera ingesta no puede reconstruir revisiones históricas que ocurrieron antes de ella.

La acción programada diaria descarga, transforma, comprueba y adjunta un artefacto. No publica, comitea ni hace push. Por tanto, la consulta es automática, mientras que la incorporación de los datos nuevos al sitio permanece sujeta a revisión. Una futura publicación automática requiere autorización expresa y una política para revisar cambios y fallos.

Una consulta fallida deja intactos los últimos archivos publicados. Una falla durante la escritura de varios archivos podría dejar un conjunto parcial; el workflow sólo adjunta artefactos cuando el comando termina correctamente. Para despliegues más exigentes, el siguiente paso es generar contratos en un directorio temporal y promover el conjunto completo de forma transaccional.
