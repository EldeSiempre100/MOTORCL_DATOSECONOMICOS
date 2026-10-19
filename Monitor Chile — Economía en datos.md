# Monitor Chile — Economía en datos

SPA de demostración construida con React, TypeScript, Vite, Tailwind CSS y Recharts. Los indicadores de ejemplo no son datos verificados ni se conectan a organismos oficiales.

## Desarrollo

```sh
pnpm install
pnpm dev
```

## Producción

```sh
pnpm build
pnpm preview
```

Los datos consumidos por la interfaz están en `public/mock-data/`. Los motores y sus contratos de staging se documentan en `data-engines/README.md`. El frontend carga los cuatro contratos JSON a través de `src/services/dataService.ts`; cada motor fuente mantiene su propio snapshot para un agregado futuro.
