import { report } from './_harness.mjs';

// Capa de datos y arranque
await import('./context.test.mjs');
await import('./router.test.mjs');
await import('./app.test.mjs');

// Vistas
await import('./login.test.mjs');
await import('./openAuth.test.mjs');
await import('./signup.test.mjs');
await import('./recover.test.mjs');
await import('./newPassword.test.mjs');
await import('./activate.test.mjs');

await report();
