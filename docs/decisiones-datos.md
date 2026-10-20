# Decisiones de arquitectura de datos

1. **Publicar datos verificables antes que completar categorías visuales.** Se excluyen del dashboard tarjetas, calendarios y gráficos demostrativos. Las categorías vacías se ocultan en el selector cuando se regeneran los contratos.
2. **INE como fuente directa.** Se preserva su identificador, protocolo SDMX, validación dimensional, revisiones y salida oficial.
3. **Mindicador como fuente intermediaria sin API Key.** Dólar observado, UF y TPM se integran con trazabilidad y estatus sourced. No se declaran series oficiales directamente verificadas del BCCh.
4. **Historial incremental con revisiones.** Se descargan datos corrientes y años recientes para contrastar registros; no se altera el pasado sin guardar revisión y marca temporal.
5. **Sin servidor SQL por anticipación.** Para el volumen actual bastan JSON versionados en GitHub y servidos por Vercel.
6. **El navegador no consume proveedores.** React consume exclusivamente JSON materializados y validados del repositorio.
7. **Separar ingesta, publicación GitHub y publicación HTTP.** GitHub Actions realiza la ingesta, tests y commit, mientras Vercel necesita una integración Git efectiva o un Deploy Hook para sincronizar automáticamente el despliegue.
8. **Falla por fuente.** Si falla un proveedor, mantener su último historial en lugar de inventar un dato o parar las demás ingestas; registrar estado partial y razón verificable.
9. **Sin cambios de diseño.** La integración conserva los componentes React existentes, añadiendo solamente estados sourced, fichas genéricas y enrutamiento SPA.
10. **No confundir definiciones.** Los niveles de UF, dólar y TPM no se etiquetan como tasas mensuales de crecimiento; los deltas en CLP se expresan en pesos y los de TPM en puntos porcentuales.
