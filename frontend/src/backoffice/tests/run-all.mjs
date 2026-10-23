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
await import('./activeMetadata.test.mjs');
await import('./activeWork.test.mjs');
await import('./activeDataset.test.mjs');
await import('./activeDatasetColumns.test.mjs');
await import('./db.test.mjs');

// classes: escalas
await import('./scaleGenerator.test.mjs');
await import('./scaleGeneratorRegen.test.mjs');
await import('./levelGenerator.test.mjs');

// router
await import('./router.test.mjs');

// views
await import('./paletasCatalogo.test.mjs');
await import('./workItemActions.test.mjs');
await import('./works.test.mjs');
await import('./invoker.test.mjs');
await import('./stepper.test.mjs');
await import('./sidebar.test.mjs');
await import('./activeGrid.test.mjs');
await import('./activeGridData.test.mjs');
await import('./valuesPopup.test.mjs');
await import('./dictionaryPopup.test.mjs');
await import('./variableSymbologyPopup.test.mjs');
await import('./metricsTab.test.mjs');
await import('./calculatedWizard.test.mjs');
await import('./valuePopup.test.mjs');
await import('./variableFormulaPopup.test.mjs');
await import('./backofficeSearch.test.mjs');

await report();
