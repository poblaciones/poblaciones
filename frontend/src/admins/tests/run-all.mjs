import { report } from './_harness.mjs';

// Capa de datos y arranque
await import('./context.test.mjs');
await import('./db.test.mjs');
await import('./router.test.mjs');
await import('./app.test.mjs');

// Vistas
await import('./layout.test.mjs');
await import('./users.test.mjs');
await import('./userPopup.test.mjs');
await import('./reviews.test.mjs');
await import('./reviewPopup.test.mjs');
await import('./works.test.mjs');
await import('./statistics.test.mjs');

await report();
