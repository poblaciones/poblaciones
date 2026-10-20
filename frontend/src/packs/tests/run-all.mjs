import { report } from './_harness.mjs';

// Capa de datos y arranque
await import('./context.test.mjs');
await import('./db.test.mjs');
await import('./geographySelectHelper.test.mjs');
await import('./router.test.mjs');
await import('./app.test.mjs');
await import('./layout.test.mjs');
await import('./geoPackageUpload.test.mjs');
await import('./selectionPopups.test.mjs');

// Vistas
await import('./metricGroups.test.mjs');
await import('./metricProviders.test.mjs');
await import('./metadataPopup.test.mjs');
await import('./gradients.test.mjs');
await import('./geographyTuples.test.mjs');
await import('./geographies.test.mjs');
await import('./clippingRegions.test.mjs');
await import('./clippingRegionPopups.test.mjs');
await import('./boundaries.test.mjs');

await report();
