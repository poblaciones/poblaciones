import { report } from './_harness.mjs';

// common/framework
await import('./arr.test.mjs');
await import('./str.test.mjs');
await import('./color.test.mjs');
await import('./date.test.mjs');
await import('./io.test.mjs');
await import('./web.test.mjs');
await import('./obj.test.mjs');
await import('./response.test.mjs');
await import('./promises.test.mjs');
await import('./ariaPlugin.test.mjs');
await import('./session.test.mjs');
await import('./err.test.mjs');
await import('./dom.test.mjs');

// common/js, common/classes, common/enums
await import('./redirectLogin.test.mjs');
await import('./axiosClient.test.mjs');
await import('./authentication.test.mjs');
await import('./citationAPA.test.mjs');
await import('./creativeCommons.test.mjs');
await import('./mapAttribution.test.mjs');
await import('./iconManager.test.mjs');
await import('./speech.test.mjs');
await import('./DbAdminBase.test.mjs');
await import('./enums.test.mjs');

// common/components (lógica pura)
await import('./mpGridHelper.test.mjs');

await report();
