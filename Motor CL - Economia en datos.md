# DOCUMENTO DE ESPECIFICACIÓN TÉCNICA (PRD) PARA MANUS AI
**Proyecto:** Monitor Chile (Clon Arquitectónico y Visual 1:1 de Monitor Argy)
**Objetivo:** Generar una Single Page Application (SPA) funcional y desacoplada para visualizar indicadores macroeconómicos de Chile, replicando con exactitud el diseño editorial, layout, micro-interacciones y estructura de https://monitorargy.com/.
**Flujo Posterior:** El repositorio generado será importado en un entorno de desarrollo (IDE) local para programar e inyectar los motores de extracción de datos (Python/SQLite/APIs) en las carpetas aisladas.

---

## 1. REGLAS ARQUITECTÓNICAS ESTRICTAS (MANDATORIO)

1. **Desacoplamiento Total de Datos (Mock-First Architecture):**
   - El frontend **NO** debe tener textos ni cifras macroeconómicas hardcodeadas dentro de los componentes `.tsx`.
   - Toda la información debe consumirse exclusivamente a través de `src/services/dataService.ts`, el cual leerá los archivos estáticos ubicados en `/public/mock-data/*.json`.
2. **Aislamiento de Motores Backend (`data-engines/`):**
   - Debes crear en la raíz del proyecto el directorio `/data-engines/` con subcarpetas independientes para cada fuente oficial chilena.
   - Dentro de cada subcarpeta, incluye un archivo plantilla (`engine_template.py` y `README.md`) que documente el esquema JSON exacto que ese motor deberá generar y depositar en `/public/mock-data/`.
3. **Fidelidad Visual 1:1 con Monitor Argy:**
   - Replicar exactamente el sistema de grillas, tipografía tabular, paleta de colores de fondo cálido (`#F5F4F0` / `#F7F7F5`), tarjetas blancas con bordes sutiles, línea de tiempo vertical y pies de gráficos detallados.

---

## 2. STACK TECNOLÓGICO REQUERIDO

- **Core:** React 18+ con TypeScript y Vite.
- **Estilos:** Tailwind CSS (con soporte para Dark Mode mediante clase `dark`).
- **Gráficos:** Recharts (configurado para gráficos combinados `ComposedChart` con doble eje Y, barras apiladas y líneas con tooltips minimalistas).
- **Iconos:** `lucide-react`.
- **Enrutamiento / Estado en URL:** Sincronización de filtros con Query Params (ej. `?categoria=vision-general&variacion=mensual&periodo=ultimo`) para que el botón `[Compartir esta vista]` copie la URL exacta.

---

## 3. ESTRUCTURA DE DIRECTORIOS A GENERAR

```text
monitor-chile/
├── data-engines/                      # [CAPA AISLADA PARA COMPLETAR EN IDE]
│   ├── schema_validator.py            # Validador Pydantic/JSON Schema de salida
│   ├── bcch_engine/                   # API Banco Central (Imacec, TPM, Dólar, UF, Balanza)
│   │   ├── README.md
│   │   └── bcch_extractor.py          # Boilerplate listo para conectar credenciales API BCCh
│   ├── ine_engine/                    # INE Chile (IPC, Desocupación ENE, IAC, IPI)
│   │   ├── README.md
│   │   └── ine_extractor.py           # Boilerplate para ingesta INE
│   ├── dipres_engine/                 # DIPRES (Frente Fiscal, Balance Estructural)
│   │   ├── README.md
│   │   └── dipres_extractor.py
│   └── mds_nowcast_engine/            # CASEN y Nowcast Pobreza / CBA
│       ├── README.md
│       └── poverty_extractor.py
├── public/
│   └── mock-data/                     # [CONTRATO DE DATOS ACTIVO]
│       ├── app_metadata.json          # Estado global, fecha corte y "series demoradas"
│       ├── timeline_events.json       # Datos para "Últimos datos y lo que viene"
│       ├── summary_cards.json         # Las 4 tarjetas principales + sub-indicadores
│       └── charts_series.json         # Series históricas completas para los 4 gráficos
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNavbar.tsx          # Logo, Buscador inline, Badge demoradas, Nav, DarkMode
│   │   │   ├── FilterBar.tsx          # Las 3 filas de filtros interactivos (Pills)
│   │   │   └── Footer.tsx             # Footer institucional de 3 columnas + créditos
│   │   ├── home/
│   │   │   ├── TimelineSection.tsx    # Bloque "Últimos datos y lo que viene"
│   │   │   ├── SummaryCardsGrid.tsx   # Grilla de 4 tarjetas KPI (Actividad, Inflación, Empleo, Pobreza)
│   │   │   └── ChartsSection.tsx      # Grilla de 4 gráficos históricos con metadatos
│   │   └── modals/
│   │       └── DelayedSeriesModal.tsx # Popover/Modal al hacer clic en "[X series demoradas]"
│   ├── services/
│   │   └── dataService.ts             # Fetcher tipado hacia /public/mock-data/
│   ├── types/
│   │   └── monitor.types.ts           # Definición estricta de contratos de datos
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
└── tsconfig.json

El documento de especificaciones técnicas (`PRD_Monitor_Chile_Manus.md`) está encapsulado en un bloque de código Markdown puro para copiar con un solo clic o guardar directamente como archivo `.md` y entregárselo a **Manus**, de modo que cuando exportes el repositorio hacia tu IDE ya cuentes con las interfaces TypeScript, los contratos JSON y las carpetas de los motores de datos listas para conectar tus scripts en Python/SQLite.

```markdown
# DOCUMENTO DE ESPECIFICACIÓN TÉCNICA (PRD) PARA MANUS AI
**Proyecto:** Monitor Chile (Clon Arquitectónico y Visual 1:1 de Monitor Argy)
**Objetivo:** Generar una Single Page Application (SPA) funcional y desacoplada para visualizar indicadores macroeconómicos de Chile, replicando con exactitud el diseño editorial, layout, micro-interacciones y estructura de https://monitorargy.com/.
**Flujo Posterior:** El repositorio generado será importado en un entorno de desarrollo (IDE) local para programar e inyectar los motores de extracción de datos (Python/SQLite/APIs) en las carpetas aisladas.

---

## 1. REGLAS ARQUITECTÓNICAS ESTRICTAS (MANDATORIO)

1. **Desacoplamiento Total de Datos (Mock-First Architecture):**
   - El frontend **NO** debe tener textos ni cifras macroeconómicas hardcodeadas dentro de los componentes `.tsx`.
   - Toda la información debe consumirse exclusivamente a través de `src/services/dataService.ts`, el cual leerá los archivos estáticos ubicados en `/public/mock-data/*.json`.
2. **Aislamiento de Motores Backend (`data-engines/`):**
   - Debes crear en la raíz del proyecto el directorio `/data-engines/` con subcarpetas independientes para cada fuente oficial chilena.
   - Dentro de cada subcarpeta, incluye un archivo plantilla (`engine_template.py` y `README.md`) que documente el esquema JSON exacto que ese motor deberá generar y depositar en `/public/mock-data/`.
3. **Fidelidad Visual 1:1 con Monitor Argy:**
   - Replicar exactamente el sistema de grillas, tipografía tabular, paleta de colores de fondo cálido (`#F5F4F0` / `#F7F7F5`), tarjetas blancas con bordes sutiles, línea de tiempo vertical y pies de gráficos detallados.

---

## 2. STACK TECNOLÓGICO REQUERIDO

- **Core:** React 18+ con TypeScript y Vite.
- **Estilos:** Tailwind CSS (con soporte para Dark Mode mediante clase `dark`).
- **Gráficos:** Recharts (configurado para gráficos combinados `ComposedChart` con doble eje Y, barras apiladas y líneas con tooltips minimalistas).
- **Iconos:** `lucide-react`.
- **Enrutamiento / Estado en URL:** Sincronización de filtros con Query Params (ej. `?categoria=vision-general&variacion=mensual&periodo=ultimo`) para que el botón `[Compartir esta vista]` copie la URL exacta.

---

## 3. ESTRUCTURA DE DIRECTORIOS A GENERAR

```text
monitor-chile/
├── data-engines/                      # [CAPA AISLADA PARA COMPLETAR EN IDE]
│   ├── schema_validator.py            # Validador Pydantic/JSON Schema de salida
│   ├── bcch_engine/                   # API Banco Central (Imacec, TPM, Dólar, UF, Balanza)
│   │   ├── README.md
│   │   └── bcch_extractor.py          # Boilerplate listo para conectar credenciales API BCCh
│   ├── ine_engine/                    # INE Chile (IPC, Desocupación ENE, IAC, IPI)
│   │   ├── README.md
│   │   └── ine_extractor.py           # Boilerplate para ingesta INE
│   ├── dipres_engine/                 # DIPRES (Frente Fiscal, Balance Estructural)
│   │   ├── README.md
│   │   └── dipres_extractor.py
│   └── mds_nowcast_engine/            # CASEN y Nowcast Pobreza / CBA
│       ├── README.md
│       └── poverty_extractor.py
├── public/
│   └── mock-data/                     # [CONTRATO DE DATOS ACTIVO]
│       ├── app_metadata.json          # Estado global, fecha corte y "series demoradas"
│       ├── timeline_events.json       # Datos para "Últimos datos y lo que viene"
│       ├── summary_cards.json         # Las 4 tarjetas principales + sub-indicadores
│       └── charts_series.json         # Series históricas completas para los 4 gráficos
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNavbar.tsx          # Logo, Buscador inline, Badge demoradas, Nav, DarkMode
│   │   │   ├── FilterBar.tsx          # Las 3 filas de filtros interactivos (Pills)
│   │   │   └── Footer.tsx             # Footer institucional de 3 columnas + créditos
│   │   ├── home/
│   │   │   ├── TimelineSection.tsx    # Bloque "Últimos datos y lo que viene"
│   │   │   ├── SummaryCardsGrid.tsx   # Grilla de 4 tarjetas KPI (Actividad, Inflación, Empleo, Pobreza)
│   │   │   └── ChartsSection.tsx      # Grilla de 4 gráficos históricos con metadatos
│   │   └── modals/
│   │       └── DelayedSeriesModal.tsx # Popover/Modal al hacer clic en "[X series demoradas]"
│   ├── services/
│   │   └── dataService.ts             # Fetcher tipado hacia /public/mock-data/
│   ├── types/
│   │   └── monitor.types.ts           # Definición estricta de contratos de datos
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
└── tsconfig.json

```

---

## 4. ESPECIFICACIÓN DETALLADA DE COMPONENTES Y UI/UX

### 4.1. Paleta y Tipografía Editorial

* **Background Principal:** `bg-[#F5F4F0]` en Light Mode / `dark:bg-[#141413]` en Dark Mode.
* **Superficie de Tarjetas y Contenedores:** `bg-white dark:bg-[#1E1E1C]`, borde `border border-stone-200/80 dark:border-stone-800`, radio `rounded-xl`, sin sombras pesadas (`shadow-none` o `shadow-xs`).
* **Tipografía:** Fuente sans-serif limpia (`Inter` o `Geist`) con clase `tabular-nums` obligatoria en todos los porcentajes, precios y fechas.
* **Semántica de Datos:**
* Positivo / Mejora: `text-emerald-700 dark:text-emerald-400`
* Negativo / Deterioro: `text-rose-700 dark:text-rose-400`
* Neutro / En línea: `text-stone-600 dark:text-stone-400`



### 4.2. Header (`TopNavbar.tsx`) y Barra de Filtros (`FilterBar.tsx`)

1. **Fila Superior (Navbar):**
* Izquierda: Marca **Monitor Chile** (`font-bold text-lg tracking-tight`) + Input buscador minimalista con ícono de lupa (`Buscar: inflación, dólar, imacec…`).
* Derecha:
* Indicador clicable con subrayado punteado: `[3 series demoradas]`.
* Links de navegación: `Monitor` (activo con subrayado sólido), `Datos`, `Contacto`.
* Selector `EN` y botón toggle de tema (Luna/Sol).




2. **Sistema de Filtros en 3 Niveles (debajo del Header):**
* **Nivel 1 (Categorías):** `Visión general` (activo), `Actividad`, `Precios`, `Dólar y UF`, `Comercio exterior`, `Tasas (TPM)`, `Frente fiscal`, `Empleo`, `Pobreza`.
* **Nivel 2 (Métrica de Variación):** `Mensual desest.` | `Interanual`. (Al alternar, las tarjetas y gráficos deben actualizar sus valores leyendo la propiedad correspondiente del JSON).
* **Nivel 3 (Período):** `Último dato` (activo), `Último mes completo · ago 2026`, `En lo que va del año`, `Últimos 12 meses`, `Personalizado`.



### 4.3. Bloque 1: `TimelineSection.tsx` ("Últimos datos y lo que viene")

* Cabecera con título `Últimos datos y lo que viene` a la izquierda y link `Calendario` a la derecha.
* Contenedor blanco con lista vertical conectada por una línea sutil izquierda (`border-l border-stone-300`):
* **Ítems Publicados (pasados):** Nodo circular sólido (`●`), fecha corta (`16 oct`), ícono temático sutil, nombre del indicador (`Dólar Observado (BCCh)` o `IPC nivel general, mensual`), badge de período (`Sep 2026`) y a la derecha el valor destacado (`$948,50` o `+0,3%`).
* **Ítems Próximos (Hoy / Futuro):** Nodo circular hueco (`○`), etiqueta `Hoy` o fecha (`21 oct`), título del evento (`Encuesta de Expectativas Económicas (EEE)` o `Imacec, septiembre`) y badge de la institución emisora (`BCCh` / `INE`).



### 4.4. Bloque 2: `SummaryCardsGrid.tsx` (Grilla de 4 Tarjetas Macro)

En escritorio se muestran en 4 columnas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`). Cada tarjeta tiene la siguiente anatomía exacta:

* **Header de Tarjeta:** Título clicable (ej. `Actividad`, `Inflación`, `Empleo`, `Pobreza`).
* **Subtítulo del Indicador Principal:** Nombre en cursiva + tipo de variación (ej. *Imacec* · Var. mensual desest.).
* **Valor Principal (Hero KPI):** Tipografía grande en negrita e itálica (`text-4xl font-extrabold italic tracking-tight tabular-nums`), coloreado según semántica (ej. `+0,6%`).
* **Línea de Contexto y Diagnóstico:** Texto compacto con evaluación en cursiva (*Mejor*, *Peor*, *Como se esperaba*) + período + comparación + expectativa del mercado (ej. *Como se esperaba · sep 2026 · vs. ago 2026 · esperado 0,3% (EEE) · salió el 8 oct*).
* **Separador horizontal sutil.**
* **Lista de 3 Sub-indicadores:** Filas con nombre a la izquierda, período en gris al centro y valor porcentual con color semántico a la derecha.
* **Footer de Tarjeta:** Texto pequeño `Fuentes: BCCh ↗ · INE ↗`.

#### Contenido de las 4 Tarjetas para Chile (Datos Mock 2026):

1. **Actividad:**
* Principal: *Imacec* · Var. mensual desest. (`+0,6%` | *Mejor* · ago 2026 · vs. jul 2026).
* Sub-indicadores: `Industria (IPI)` (Ago 2026 `+1,2%`), `Construcción (IMACON)` (Ago 2026 `-0,4%`), `Comercio (IAC)` (Ago 2026 `+2,1%`).
* Fuentes: `BCCh ↗` · `INE ↗`.


2. **Inflación:**
* Principal: *IPC nivel general* · Var. mensual (`+0,3%` | *Como se esperaba* · sep 2026 · esperado 0,3% (EEE) · salió el 8 oct).
* Sub-indicadores: `IPC sin volátiles` (Sep 2026 `+0,2%`), `IPC Alimentos y energía` (Sep 2026 `+0,5%`), `Precios Productor (IPP)` (Sep 2026 `+0,8%`).
* Fuentes: `INE ↗` · `BCCh ↗`.


3. **Empleo:**
* Principal: *Ocupados formales (INE/AFC)* · Var. mensual desest. (`+0,2%` | *Mejor* · trim. móvil jun–ago 2026 · salió el 29 sep).
* Sub-indicadores: `Tasa de desocupación` (Jun–ago 2026 `8,4%`), `Ocupación informal` (Jun–ago 2026 `27,2%`), `Remuneraciones reales (IR)` (Ago 2026 `+1,8%`).
* Fuentes: `INE ↗` · `Superintendencia de Pensiones ↗`.


4. **Pobreza:**
* Principal: *Pobreza por ingresos (Nowcast)* (`6,8%` | Mar–ago 2026 · `-0,1 p.p.` vs. feb–jul 2026).
* Sub-indicadores: `Pobreza oficial (CASEN)` (Medición vigente `6,5%`), `Pobreza extrema (CASEN)` (`2,1%`), `Canasta Básica (CBA) real` (Sep 2026 `+0,1%`).
* Fuentes: `Ministerio de Desarrollo Social ↗` · `INE ↗`.



### 4.5. Bloque 3: `ChartsSection.tsx` (Los 4 Gráficos Principales)

Cada gráfico va en su propio contenedor blanco a ancho completo o grilla de 2x2 (replicando el flujo vertical limpio de Monitor Argy):

1. **Gráfico 1: `Imacec desest. var. mensual**`
* Tipo: `ComposedChart` (Barras para `Imacec desest. var. mensual` en eje izquierdo `%`, y Línea continua para `Índice Imacec desestacionalizado (base 2018=100)` en eje derecho).
* Ventana: Ago 2024 a Ago 2026.


2. **Gráfico 2: `IPC var. mensual**`
* Tipo: `ComposedChart` (Barras para `IPC var. mensual` y Línea suave para `IPC var. mensual, media móvil 3 meses`).
* Ventana: Oct 2024 a Sep 2026.


3. **Gráfico 3: `Puestos de trabajo: aporte de cada tipo a la var. interanual**`
* Tipo: Barras apiladas (`Asalariados formales`, `Asalariados informales`, `Cuenta propia`) + Línea superpuesta (`Total, var. interanual`).
* Ventana: 3T 2024 a 3T 2026.


4. **Gráfico 4: `Pobreza: estimación móvil y dato oficial CASEN**`
* Tipo: Gráfico de líneas dobles con puntos marcados (`Nowcast semestre móvil` vs `Dato oficial CASEN`).



* **Pie obligatorio en cada gráfico:**
* Izquierda: `Fuente: [Nombre Institución ↗]`
* Derecha: `Último dato: [período] · hace [X] días · monitorchile.cl`


* Debajo del cuarto gráfico, incluir el botón `[Compartir esta vista]` con el texto auxiliar `"El link lleva el período y la variación elegidos."`

### 4.6. Bloque 4: `Footer.tsx` (Cierre Institucional)

Replicar exactamente el diseño del bloque inferior de la página:

* Columna 1 (`Monitor`): Links a las 9 categorías.
* Columna 2 (`Herramientas`): `Coyuntura`, `Calendario de datos`, `Descargar CSV` (debe permitir descargar un CSV generado desde los JSON mock), `API y conector MCP`.
* Columna 3 (`Proyecto`): `Cómo se hace`, `Contacto`, redes y barra inferior con `Fuentes` y licencia `CC BY 4.0`.

---

## 5. CONTRATOS DE DATOS (`src/types/monitor.types.ts`)

El archivo de tipos debe implementar exactamente estas interfaces para garantizar compatibilidad inmediata con el posterior backend en Python:

```typescript
export type SentimentType = 'positive' | 'negative' | 'neutral';
export type VariationMode = 'monthly_sa' | 'yoy';

export interface AppMetadata {
  lastUpdated: string;
  delayedSeriesCount: number;
  delayedSeriesList: {
    id: string;
    name: string;
    source: string;
    expectedDate: string;
    daysDelayed: number;
  }[];
}

export interface TimelineEvent {
  id: string;
  dateLabel: string;        // ej: "16 oct" o "Hoy"
  isoDate: string;          // ej: "2026-10-16"
  isPublished: boolean;     // true = círculo lleno, false = círculo vacío
  category: string;
  title: string;            // ej: "IPC nivel general, mensual"
  period?: string;          // ej: "Sep 2026"
  institution: string;      // ej: "INE" | "BCCh"
  value?: string;           // ej: "+0,3%"
  sentiment?: SentimentType;
  sourceUrl: string;
}

export interface SubIndicator {
  id: string;
  name: string;
  periodLabel: string;      // ej: "Sep 2026 · salió el 8 oct"
  values: {
    monthly_sa: string;
    yoy: string;
  };
  sentiment: SentimentType;
  url: string;
}

export interface SummaryCard {
  id: string;
  categorySlug: string;     // ej: "actividad", "precios", "empleo", "pobreza"
  title: string;            // ej: "Inflación"
  mainIndicatorName: string;// ej: "IPC nivel general"
  metrics: {
    monthly_sa: {
      metricLabel: string;  // ej: "Var. mensual"
      value: string;        // ej: "+0,3%"
      statusText: string;   // ej: "Como se esperaba"
      sentiment: SentimentType;
      contextDetails: string; // ej: "sep 2026 · vs. ago 2026 · esperado 0,3% (EEE) · salió el 8 oct"
    };
    yoy: {
      metricLabel: string;  // ej: "Var. interanual"
      value: string;        // ej: "+3,8%"
      statusText: string;
      sentiment: SentimentType;
      contextDetails: string;
    };
  };
  subIndicators: SubIndicator[];
  sources: { name: string; url: string }[];
}

export interface ChartDataPoint {
  period: string;           // ej: "Ago 26"
  isoDate: string;          // ej: "2026-08-01"
  primaryBar?: number;      // ej: 0.6
  secondaryLine?: number;   // ej: 104.2
  stackA?: number;
  stackB?: number;
  stackC?: number;
  totalLine?: number;
}

export interface ChartBlock {
  id: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  chartType: 'composed_bar_line' | 'bar_moving_avg' | 'stacked_bar_line' | 'dual_line';
  yAxisLeftUnit: string;    // ej: "Var. %" o "%"
  yAxisRightUnit?: string;  // ej: "Índice"
  seriesLabels: {
    key: string;
    label: string;
    color: string;
  }[];
  data: ChartDataPoint[];
  sourceName: string;
  sourceUrl: string;
  lastDataPeriod: string;   // ej: "sep 2026"
  daysSinceRelease: number; // ej: 11
}

```

---

## 6. INSTRUCCIONES PARA LA CARPETA `data-engines/` (PRE-CONFIGURACIÓN IDE)

En cada subcarpeta de `data-engines/` (`bcch_engine`, `ine_engine`, `dipres_engine`, `mds_nowcast_engine`), genera un script en Python que contenga la clase base desacoplada con la siguiente firma estándar, lista para ser implementada en el IDE:

```python
# Ejemplo: data-engines/bcch_engine/bcch_extractor.py
from pathlib import Path
import json
from datetime import datetime

class BCChDataEngine:
    """
    Motor de extracción para series del Banco Central de Chile (SIETE REST API).
    Series objetivo:
    - F032.IMC.IND.Z.Z.EP18.Z.Z.0.M (Imacec empalmado, desestacionalizado)
    - F073.TCO.PRE.Z.D (Dólar Observado diario)
    - F072.TPM.TIN.D001.NO.Z.D (Tasa de Política Monetaria)
    """
    def __init__(self, output_dir: str = "../../public/mock-data"):
        self.output_dir = Path(output_dir)

    def fetch_raw_series(self, series_id: str, start_date: str, end_date: str) -> dict:
        # TODO: Implementar llamada HTTP / sqlite3 en Antigravity IDE
        raise NotImplementedError("Conectar con credenciales BCCh o base SQLite local.")

    def transform_to_contract(self, raw_data: dict) -> dict:
        # Transforma la respuesta cruda al contrato definido en monitor.types.ts
        pass

    def export_json(self, filename: str, payload: dict) -> None:
        target = self.output_dir / filename
        with open(target, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

```

---

## 7. CRITERIOS DE ACEPTACIÓN FINAL PARA MANUS

1. El proyecto debe compilar y ejecutarse sin errores con `npm install && npm run dev`.
2. Los 4 archivos JSON en `/public/mock-data/` deben venir completamente poblados con datos chilenos coherentes hasta **octubre de 2026** (al menos 24 puntos históricos por cada gráfico para que las visualizaciones luzcan idénticas en densidad a Monitor Argy).
3. Al hacer clic en las píldoras de categorías (`Actividad`, `Precios`, `Empleo`, `Pobreza`), o al alternar entre `Mensual desest.` e `Interanual`, la vista debe reaccionar dinámicamente sin recargar la página.
4. El botón `Descargar CSV` del footer debe generar y descargar en el navegador un archivo `.csv` consolidado a partir de los datos de `/public/mock-data/charts_series.json`.

```

---

### Recomendación operativa para el paso a Manus y Antigravity IDE:
1. **En Manus:** Adjunta o pega este bloque completo e indícale: *"Ejecuta íntegramente este PRD. Prioriza la fidelidad visual con [https://monitorargy.com/](https://monitorargy.com/) y asegúrate de poblar los 4 archivos JSON en `/public/mock-data/` con al menos 24 meses de datos realistas para Chile al corte de octubre 2026"*.
2. **Al abrirlo en Antigravity IDE:** Solo tendrás que abrir la carpeta `data-engines/`, conectar tus scripts de Python (API SIETE del Banco Central y extractores del INE) y apuntar su salida directamente hacia `/public/mock-data/` (o levantar un endpoint local en FastAPI/SQLite cambiando una sola línea en `src/services/dataService.ts`).

