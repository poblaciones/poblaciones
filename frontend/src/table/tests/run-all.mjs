/*
 * run-all.mjs — corre toda la batería de pruebas.
 *
 * Correr:
 *     node --import ./tests/_register-alias.mjs tests/run-all.mjs
 *
 * El registrador de alias permite importar los fuentes por "@/table/..." igual
 * que en el proyecto, y mapea las dependencias del proyecto a stubs mínimos
 * (tests/_stubs) para poder cargar clases como ActivePivot sin todo el framework.
 */

import { report, exitCode } from './_harness.mjs';

console.log('\n=== pivotStats ===');
await import('./pivotStats.test.mjs');
console.log('\n=== ActiveRoute ===');
await import('./ActiveRoute.test.mjs');
console.log('\n=== AnalysisColumns ===');
await import('./AnalysisColumns.test.mjs');
console.log('\n=== ActiveDataset ===');
await import('./ActiveDataset.test.mjs');
console.log('\n=== ActivePivot ===');
await import('./ActivePivot.test.mjs');

await import('./CollapseState.test.mjs');
console.log('\n=== ColumnDragController ===');
await import('./ColumnDragController.test.mjs');
console.log('\n=== CsvWriter ===');
await import('./CsvWriter.test.mjs');
console.log('\n=== ActiveBoundarySet ===');
await import('./ActiveBoundarySet.test.mjs');
console.log('\n=== Distribution ===');
await import('./Distribution.test.mjs');

await report();
process.exit(exitCode());
