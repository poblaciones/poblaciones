// Fachada ESM de los validadores reales de vuelidate. Se reexportan los
// validadores del paquete (sin reimplementarlos); el import nombrado
// `checked` de Signup.vue no existe en vuelidate: webpack lo resuelve como
// undefined con una advertencia, pero Node lo trataría como un error de
// enlace, de ahí este export explícito.
import { createRequire } from 'node:module';

const validators = createRequire(import.meta.url)('vuelidate/lib/validators');

export const required = validators.required;
export const email = validators.email;
export const minLength = validators.minLength;
export const sameAs = validators.sameAs;
export const checked = undefined;
export default validators;
