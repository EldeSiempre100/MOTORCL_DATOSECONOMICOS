# MOTORCL — implementación del linaje de motores (fase multifuente)

Base: commit b5e3102 de main, con interfaz de Antigravity conservada.

## Implementado

- Motor INE/SIMEL original intacto como fuente oficial directa.
- Nuevo adaptador Mindicador sin claves para dólar observado, UF y TPM.
- Normalización y validación por unidad, fecha, código, rango y ausencia de proyecciones; historial con detección de revisiones y SHA256.
- Pipeline de salida a data/series, public/series, public/mock-data y public/data; genera catálogo y auditoría de ejecución.
- Desaparecen del contrato de publicación las cifras y el calendario de ejemplo; los componentes frontend filtran preventivamente cualquier dato marcado como demo.
- Las fuentes intermediadas quedan identificadas sin clasificarse indebidamente como oficiales.
- Workflow diario con tests, build y commit/versionado automático de JSON.
- Fichas y CSV conectados al nuevo esquema de series y rewrite SPA para Vercel.
- Vista previa de Vercel usada para validar la compilación y las rutas de JSON.

## Observado en la primera ejecución real del pipeline

Fecha: 20 de octubre de 2026. INE/SIMEL: 198 observaciones; Mindicador dólar: 697; UF: 1.024; TPM: 698. La ejecución inicial registró result: ok con los cuatro motores y generó los JSON de consumo.

El catálogo es la referencia autorizada para consultar períodos y valores presentes. El número de observaciones y las fechas cambian en cada ingesta.

## Dependencia de producción pendiente

La automatización de Vercel exige vincular el proyecto existente a Git o configurar en GitHub Actions el secreto VERCEL_DEPLOY_HOOK_URL. La actualización de archivos GitHub no es por sí misma una actualización HTTP de Vercel. No se incorporan secretos en código.

## Pendientes técnicos posteriores

Homologar IPC directamente con INE, ampliar Imacec con definición comprobada, y estudiar DIPRES y fuentes energéticas/regionales. Mantener excluidas las series no validadas.
