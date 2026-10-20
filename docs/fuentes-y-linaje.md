# Fuentes y linaje estadístico — MotorCL

Actualizado: 20 de octubre de 2026. Los períodos efectivos siempre se consultan en public/data/catalog.json; no deben inferirse de este documento.

| ID estable | Serie | Acceso | Estatus | Frecuencia y unidad | Fecha de publicación |
|---|---|---|---|---|---|
| ine.ene.tdes.nacional.total | Tasa de desocupación nacional | INE/SIMEL SDMX, CL01:DF_TDES_SEXO(1.0)/M.TDES._T.AS | official, organismo emisor directo | trimestre móvil, lectura mensual; % | Publicación documental registrada solo si existe |
| mindicador.dolar.observado | Dólar observado | https://mindicador.cl/api/dolar | sourced, intermediario que atribuye el origen a BCCh | día hábil; CLP/USD | No informada por proveedor |
| mindicador.uf | Unidad de Fomento | https://mindicador.cl/api/uf | sourced, intermediario que atribuye el origen a BCCh | diaria; CLP/UF | No informada por proveedor |
| mindicador.tpm | Tasa de Política Monetaria | https://mindicador.cl/api/tpm | sourced, intermediario que atribuye el origen a BCCh | fechas reportadas por proveedor; % | No informada por proveedor |

Fuente INE: https://sdmx.ine.gob.cl/rest/data/CL01,DF_TDES_SEXO,1.0/M.TDES._T.AS?format=csv

Referencia metodológica del emisor: https://www.bcentral.cl/

Documentación del intermediario: https://www.mindicador.cl/ (API sin clave; se consultan endpoint anual y endpoint corriente).

## Precauciones estadísticas

- El sello official exige un endpoint del emisor original. Mindicador se identifica como intermediario; sourced significa procedencia registrada, no homologación automática del Banco Central.
- IPC no se integra a partir de un valor genérico desactualizado: antes debe verificarse base, período, unidades y consistencia frente a INE.
- Imacec no se representa como mensual desestacionalizado sin verificar explícitamente la definición de la fuente.
- El desempleo se representa en nivel %, y sus diferencias en puntos porcentuales; no se recalculan porcentajes de una tasa como crecimiento.
- No se publican proyecciones, fechas de publicación inferidas ni observaciones futuras. Una falla conserva el historial antiguo y registra la advertencia.
- Cambios históricos detectados por MotorCL se conservan en revisions[] y no se atribuyen al organismo como revisión anunciada.
- No se reutiliza código externo GPL ni se reproducen licencias sin evaluación.

## Esquema y trazabilidad

Los objetos fuente contienen id, organization, sourceProvider, officialCode (si existe), providerCode (si corresponde), sourceUrl, methodologyUrl, frequency, unit, lastSuccessfulRefresh y observations.

Cada observación contiene period, observedFrom, observedTo, value, sourceStatus, publishedAt o null, documentUrl o null, firstSeenAt, lastChangedAt y revisions[]. El catálogo público guarda SHA256 de la serie, estado, último período y fuente. El registro de ingesta identifica éxito, errores y períodos por motor.

Los campos de publicación nulos no se sustituyen con fechas de consulta. La fecha del snapshot JSON es distinta de la fecha del dato.
