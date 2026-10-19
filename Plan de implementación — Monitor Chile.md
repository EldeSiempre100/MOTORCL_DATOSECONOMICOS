# Plan de implementación — Monitor Chile

## Alcance y enfoque

Construir una SPA funcional en React 18, TypeScript y Vite que traduzca el PRD adjunto en un tablero editorial de indicadores macroeconómicos chilenos. La referencia de composición y microinteracciones es Monitor Argy; la adaptación conserva la identidad chilena y la paleta cálida indicada. La interfaz será «mock-first»: componentes y vistas reciben datos tipados solo a través de `src/services/dataService.ts`, que cargará contratos JSON de `public/mock-data/`. Los ejemplos numéricos y fechas del PRD se identificarán visiblemente como **datos demostrativos, no verificados**, y no como una actualización oficial.

No se conectarán APIs oficiales ni se afirmará actualidad de los indicadores en esta entrega. Los motores Python quedarán aislados como plantillas documentadas para completar posteriormente en el IDE; su contrato común escribirá archivos JSON en `public/mock-data/`.

## Diseño

- **Movimiento:** tablero editorial de datos inspirado en la publicación económica de Monitor Argy; sobrio, de lectura rápida y centrado en la fecha y procedencia de cada cifra.
- **Principios:** jerarquía tipográfica clara; contexto y fuente junto a cada indicador; precisión mediante números tabulares y estados accesibles; interacción ligera y directa.
- **Color:** fondos cálidos `#F5F4F0` / `#F7F7F5` y superficies blancas para una estética de papel de informe; verde para mejora, rosa-rojo para deterioro y piedra para neutralidad. Modo oscuro `#141413` con superficies `#1E1E1C`.
- **Composición:** navegación y filtros compactos en la parte superior; línea de tiempo a todo lo ancho; cuatro tarjetas KPI alineadas en escritorio; cuatro gráficos históricos en una grilla responsiva; pie institucional. En móvil, filtros desplazables y columnas apiladas.
- **Motivos distintivos:** línea cronológica vertical con nodos publicados/próximos; chips de filtro delineados; metadatos editoriales discretos para período, fuente, expectativa y fecha de publicación.
- **Interacción y movimiento:** búsqueda de indicadores; categoría, variación y período sincronizados en query params; botones de compartir URL, alternar tema y abrir detalle de series demoradas; animaciones breves de transición, sin movimiento decorativo persistente.
- **Tipografía:** sans-serif Inter o Geist para interfaz y títulos; cifras con `tabular-nums`, énfasis itálico/negrita para KPIs; contraste suficiente entre rótulos y metadatos.
- **Esencia de marca:** una lectura clara y trazable de la economía chilena; personalidad rigurosa, legible y serena.
- **Voz:** titulares informativos y concisos. Ejemplos: «La economía chilena, con la fecha de cada dato.» y «Cada cifra, con su período y fuente a la vista.»
- **Marca:** wordmark tipográfico Monitor Chile acompañado por un isotipo propio de tres barras/una línea, dibujado como SVG simple y sin fotografía decorativa.
- **Color distintivo:** verde petróleo apagado de acento, subordinado a la paleta neutral editorial.

## Componentes y comportamiento

- `TopNavbar`: wordmark, campo de búsqueda, badge clicable de series demoradas, navegación Monitor/Datos/Contacto, control EN y alternancia de tema.
- `FilterBar`: filtros en tres niveles —categorías, Mensual desest./Interanual, y períodos Último dato/Último mes completo/En lo que va del año/Últimos 12 meses/Personalizado—. La selección se inicializa y mantiene con query params, y «Compartir esta vista» copia la URL exacta.
- `TimelineSection`: lista vertical de publicaciones recientes y eventos próximos, con fecha, indicador, período, valor e institución.
- `SummaryCardsGrid`: cuatro áreas (Actividad, Inflación, Empleo y Pobreza), cada una con indicador principal, variación, diagnóstico, contexto, tres subindicadores, color semántico y fuentes.
- `ChartsSection`: cuatro visualizaciones Recharts de las series mock para Actividad, Precios, Empleo y Pobreza; ComposedChart con ejes/leyendas adecuados, líneas y barras apiladas cuando lo permita la serie, tooltips compactos y pies con fuente, período y unidad.
- `DelayedSeriesModal`: diálogo accesible con las series demoradas, fuente y fecha de actualización conocida o estimada.
- `Footer`: tres columnas de navegación/fuentes/créditos y descargo visible de datos de demostración.

## Arquitectura y estructura

```text
public/mock-data/                  # contratos JSON de metadatos, timeline, KPI y series
public/manus-routes.json           # rutas de página declaradas para Preview
src/components/layout/             # navbar, filtros y footer
src/components/home/               # timeline, tarjetas y gráficos
src/components/modals/              # detalle accesible de series demoradas
src/services/dataService.ts         # único acceso de la interfaz a archivos mock
src/types/monitor.types.ts          # contratos TypeScript
src/App.tsx, src/main.tsx           # composición SPA y arranque
src/index.css                       # Tailwind y estilos base responsivos
 data-engines/schema_validator.py   # validación del contrato JSON compartido
 data-engines/{bcch,ine,dipres,mds_nowcast}_engine/ # boilerplate Python y README
```

Los motores de datos escribirán los mismos cuatro archivos de mock mediante `data-engines/`, sin dependencia con el código React. Se incluirán `engine_template.py` y el extractor nominal descrito por el PRD en cada fuente. El validador documentará/validará la forma de salida. Las fuentes contempladas son BCCh (Imacec, TPM, dólar, UF y balanza), INE (IPC, empleo ENE, IAC e IPI), DIPRES (frente fiscal y balance estructural) y MDS/CASEN (pobreza y canasta básica). Las plantillas no incluirán credenciales ni extracción real.

## Stack y dependencias

React 18+, TypeScript, Vite, Tailwind CSS con soporte `dark` por clase, Recharts y `lucide-react`. TypeScript aplicará tipos de extremo a extremo en el servicio y los componentes. Las fechas y porcentajes usarán cifras tabulares. No se requiere servidor ni base de datos: Preview y build servirán el frontend estático con JSON locales.

## Rutas, archivos y entrega

Una ruta raíz (`/`) con filtros de URL, además del manifiesto `public/manus-routes.json`. Crear `package.json`, configuración de Vite/TypeScript/Tailwind, los cuatro JSON de datos demostrativos, componentes, contratos TS, servicio y plantillas/README de motores. Dejar un build declarativo apto para exportación estática. No habilitar publicación automática ni conectar GitHub salvo autorización posterior.

## Límites conocidos

Los valores proporcionados por el PRD son ejemplos con períodos de 2026 y no están verificados contra los organismos emisores. El panel se etiquetará claramente como maqueta demostrativa para evitar que se interprete como una publicación oficial o una conexión a fuentes en tiempo real.
