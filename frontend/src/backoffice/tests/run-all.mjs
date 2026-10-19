import { report } from './_harness.mjs';

// classes: formato y validación
await import('./formatter.test.mjs');
await import('./variableNameValidator.test.mjs');
await import('./localization.test.mjs');

// classes: estado y reglas de negocio
await import('./workPermissions.test.mjs');
await import('./scaleStates.test.mjs');
await import('./moduleApp.test.mjs');
await import('./context.test.mjs');

// classes: acceso a datos
await import('./asyncCatalog.test.mjs');
await import('./workSearch.test.mjs');
await import('./dataPager.test.mjs');

await report();
