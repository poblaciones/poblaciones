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
await import('./stepSource.test.mjs');
await import('./georeferenceTab.test.mjs');
await import('./importPopup.test.mjs');
await import('./sharePopup.test.mjs');
await import('./identityTab.test.mjs');
await import('./attachmentPopup.test.mjs');
await import('./metricPopup.test.mjs');
await import('./levelPopup.test.mjs');
await import('./variableOptionsPopup.test.mjs');
await import('./newMetric.test.mjs');
await import('./columnHeaderMenu.test.mjs');
await import('./iconPickerPopup.test.mjs');
await import('./institutionPopup.test.mjs');
await import('./metadataView.test.mjs');
await import('./columnPopup.test.mjs');
await import('./fieldOperations.test.mjs');
await import('./fieldCalculatorPopup.test.mjs');
await import('./statisticsPopup.test.mjs');
await import('./datasetView.test.mjs');
await import('./contentView.test.mjs');
await import('./codesSelection.test.mjs');
await import('./customizeMetrics.test.mjs');
await import('./stepMetric.test.mjs');
await import('./metadataSources.test.mjs');
await import('./metadataInstitutions.test.mjs');
await import('./iconPreview.test.mjs');
await import('./mpIconFontPanel.test.mjs');
await import('./customizeStartup.test.mjs');
await import('./onboardingStep.test.mjs');
await import('./pickInstitution.test.mjs');
await import('./multilevelTab.test.mjs');
await import('./pickMetric.test.mjs');
await import('./smallPopups.test.mjs');
await import('./attachmentsOnboarding.test.mjs');
await import('./searchAndHome.test.mjs');
await import('./layoutAndHome.test.mjs');
await import('./layoutAndApp.test.mjs');
await import('./backofficeSearch.test.mjs');

await report();
