// Fachada ESM de los validadores reales de vuelidate: reexporta los del
// paquete (sin reimplementarlos). El paquete es CommonJS y se carga con
// createRequire, que resuelve desde node_modules del proyecto.
import { createRequire } from 'node:module';

const validators = createRequire(import.meta.url)('vuelidate/lib/validators');

export const required = validators.required;
export const email = validators.email;
export const minLength = validators.minLength;
export const sameAs = validators.sameAs;
export default validators;
