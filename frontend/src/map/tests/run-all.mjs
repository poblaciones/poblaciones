import { report } from './_harness.mjs';

await import('./mercator.test.mjs');
await import('./metricsList.test.mjs');
await import('./activeMetric.test.mjs');
await import('./segmentsComposer.test.mjs');
await import('./routes.test.mjs');
await import('./indicatorSelector.test.mjs');
await import('./helperQueue.test.mjs');
await import('./mapLegend.test.mjs');
await import('./clippingLegend.test.mjs');
await import('./segmentedMap.test.mjs');

await report();
