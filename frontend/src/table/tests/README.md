# Pruebas del módulo `table`

Batería sin dependencias ni runner externo. Usa un micro-harness propio
(`_harness.mjs`) y datos fijos reutilizables (`fixtures.mjs`).

## Cómo correr

Toda la batería (con el registrador de alias, necesario para los tests que
importan por `@/table/...`):

    node --import ./tests/_register-alias.mjs tests/run-all.mjs

Un archivo puntual sin alias (pivotStats, pivotRoute):

    node tests/pivotStats.test.mjs
    node tests/pivotRoute.test.mjs

Un archivo que usa alias (AnalysisColumns):

    node --import ./tests/_register-alias.mjs tests/AnalysisColumns.test.mjs

Requiere Node con ESM (14+). El `package.json` de esta carpeta declara
`"type": "module"`.

## Qué cubre

- **pivotStats**: media/describe ponderados, Pearson y Spearman, matriz de
  correlaciones (asimetría por pesos), regresión lineal y simple, cuantiles.
- **pivotRoute**: round-trip de serialización/parseo (versiones múltiples,
  selección de categorías, regiones).
- **AnalysisColumns**: el modelo de columnas del analizador de relaciones
  (construcción desde el dataset, nombres por columna, subconjunto de
  regresión, escala compartida, matriz/1×N/regresión/par). Reemplaza al viejo
  `relationsData` (funciones sueltas), ahora con comportamiento en objetos.

## Resolución del alias `@/table/...`

`_register-alias.mjs` registra `_alias-hooks.mjs`, un hook de resolución que
mapea `@/table/<x>` a la ruta real bajo `table/`. Así los tests importan los
fuentes igual que el proyecto, sin tocarlos.

## Datos fijos

`fixtures.mjs` centraliza los conjuntos: vectores con estadísticos conocidos,
columnas para la matriz de correlación, y un dataset mínimo que respeta el
contrato de `PivotDataset` (`columns` + `dataRows()`), con dos indicadores (uno
de conteo con solo Total y otro con categorías) sobre cuatro provincias.

Nota: el dataset de prueba tiene sólo cuatro regiones y categorías que suman 100
(colinealidad perfecta), por lo que la *convergencia numérica* de la regresión
múltiple no se prueba sobre él (eso se cubre en `pivotStats` con datos sanos);
sobre el fixture se valida la *selección de regresores*.
